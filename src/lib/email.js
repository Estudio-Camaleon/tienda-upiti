import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Upiti";
  const from = `${storeName} <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

  await transporter.sendMail({ from, to, subject, html });
}
