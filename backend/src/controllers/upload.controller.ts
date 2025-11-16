import { Request, Response } from 'express';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { encode } from 'blurhash';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  ...(process.env.USE_MINIO === 'true' && {
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
  }),
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export async function uploadFiles(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];
    const userId = req.userId!;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedMedia = [];

    for (const file of files) {
      const fileId = uuidv4();
      const ext = file.originalname.split('.').pop();
      const key = `uploads/$${userId}/$$ {fileId}.${ext}`;

      let processedBuffer = file.buffer;
      let width: number | undefined;
      let height: number | undefined;
      let blurhash: string | undefined;
      let thumbnailKey: string | undefined;

      // Process images
      if (file.mimetype.startsWith('image/')) {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();
        width = metadata.width;
        height = metadata.height;

        // Resize if too large
        if (width && width > 2048) {
          processedBuffer = await image
            .resize(2048, null, { withoutEnlargement: true })
            .toBuffer();
        }

        // Generate blurhash for images
        const smallImage = await sharp(file.buffer)
          .resize(32, 32, { fit: 'inside' })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        blurhash = encode(
          new Uint8ClampedArray(smallImage.data),
          smallImage.info.width,
          smallImage.info.height,
          4,
          4
        );

        // Create thumbnail
        thumbnailKey = `thumbnails/$${userId}/$$ {fileId}.jpg`;
        const thumbnailBuffer = await sharp(file.buffer)
          .resize(400, 400, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();

        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
          })
        );
      }

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: processedBuffer,
          ContentType: file.mimetype,
        })
      );

      // Generate URL
      const url = process.env.USE_MINIO === 'true'
        ? `$${process.env.S3_ENDPOINT}/$$ {BUCKET}/${key}`
        : `https://$${BUCKET}.s3.$$ {process.env.AWS_REGION}.amazonaws.com/${key}`;

      const thumbnailUrl = thumbnailKey
        ? process.env.USE_MINIO === 'true'
          ? `$${process.env.S3_ENDPOINT}/$$ {BUCKET}/${thumbnailKey}`
          : `https://$${BUCKET}.s3.$$ {process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`
        : undefined;

      // Save to database
      const media = await prisma.media.create({
        data: {
          userId,
          url,
          thumbnailUrl,
          type: file.mimetype.split('/')[0], // image, video, audio, application
          mimeType: file.mimetype,
          width,
          height,
          size: file.size,
          blurhash,
        },
      });

      uploadedMedia.push(media);
    }

    res.json({ media: uploadedMedia });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
}
