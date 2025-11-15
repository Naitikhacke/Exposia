import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(email: string, name: string) {
  const verificationUrl = `${process.env.API_URL}/api/auth/verify-email/token`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your Exposia account',
    html: `
      <h1>Welcome to Exposia, ${name}!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, name: string) {
  const resetUrl =
