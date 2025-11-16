import { PrismaClient, PostType, ReactionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TOPICS = [
  { name: 'Artificial Intelligence', slug: 'ai', description: 'Machine learning, neural networks, and AI research' },
  { name: 'Quantum Computing', slug: 'quantum', description: 'Quantum mechanics and computing' },
  { name: 'Biotechnology', slug: 'biotech', description: 'Biology, genetics, and medical research' },
  { name: 'Space Exploration', slug: 'space', description: 'Astronomy, aerospace, and space missions' },
  { name: 'Renewable Energy', slug: 'energy', description: 'Solar, wind, and sustainable energy' },
  { name: 'Robotics', slug: 'robotics', description: 'Automation and robotic systems' },
  { name: 'Neuroscience', slug: 'neuroscience', description: 'Brain research and cognitive science' },
  { name: 'Climate Science', slug: 'climate', description: 'Climate change and environmental studies' },
  { name: 'Materials Science', slug: 'materials', description: 'Advanced materials and nanotechnology' },
  { name: 'Data Science', slug: 'data-science', description: 'Analytics, visualization, and big data' },
];

const SKILLS = [
  'Python', 'JavaScript', 'Machine Learning', 'Data Analysis', 'Research',
  'Writing', 'Design', 'Photography', 'Video Production', 'Public Speaking',
  'Project Management', 'Statistics', 'Biology', 'Chemistry', 'Physics',
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clean database
  await prisma.postTopic.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.media.deleteMany();
  await prisma.post.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.session.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Database cleaned');

  // Create topics
  const topics = await Promise.all(
    TOPICS.map((topic) =>
      prisma.topic.create({
        data: topic,
      })
    )
  );

  console.log(`📚 Created ${topics.length} topics`);

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const users = [];

  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@exposia.com`,
        password: hashedPassword,
        name: `Test User ${i}`,
        bio: i % 3 === 0 ? `Passionate about science and technology. Researcher and innovator.` : undefined,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`,
        emailVerified: i % 2 === 0,
        role: i === 0 ? 'ADMIN' : i < 3 ? 'MODERATOR' : 'USER',
        profile: {
          create: {
            location: i % 4 === 0 ? 'San Francisco, CA' : undefined,
            website: i % 5 === 0 ? `https://user${i}.com` : undefined,
            skills: SKILLS.slice(0, Math.floor(Math.random() * 5) + 3),
          },
        },
      },
    });
    users.push(user);
  }

  console.log(`👥 Created ${users.length} users`);

  // Create follows
  let followCount = 0;
  for (let i = 0; i < users.length; i++) {
    const numFollows = Math.floor(Math.random() * 15) + 5;
    for (let j = 0; j < numFollows; j++) {
      const followingIndex = Math.floor(Math.random() * users.length);
      if (followingIndex !== i) {
        try {
          await prisma.follow.create({
            data: {
              followerId: users[i].id,
              followingId: users[followingIndex].id,
            },
          });
          followCount++;
        } catch (error) {
          // Duplicate follow, ignore
        }
      }
    }
  }

  console.log(`🤝 Created ${followCount} follow relationships`);

  // Create posts
  const postTypes: PostType[] = ['MICRO', 'ARTICLE', 'PROJECT', 'REEL'];
  const posts = [];

  for (let i = 0; i < 200; i++) {
    const authorIndex = Math.floor(Math.random() * users.length);
    const type = postTypes[Math.floor(Math.random() * postTypes.length)];
    const
