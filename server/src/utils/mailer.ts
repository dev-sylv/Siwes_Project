import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
};

export const sendAnnouncementEmail = async (
  emails: string[],
  title: string,
  message: string,
): Promise<void> => {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("Email is not configured; skipping announcement email");
    return;
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const BATCH_SIZE = 50;

  // BCC in batches so students never see each other's addresses
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);
    try {
      await mailer.sendMail({
        from,
        to: from,
        bcc: batch,
        subject: `[CS Department] ${title}`,
        text: `${message}\n\n-- Computer Science Department Student Guide`,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error(
        `Announcement email failed for a batch of ${batch.length}:`,
        reason,
      );
    }
  }
};
