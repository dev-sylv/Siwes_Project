import nodemailer, { Transporter } from "nodemailer";

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const CONCURRENCY = 10;

const senderEmail = () => process.env.MAIL_FROM || process.env.SMTP_USER || "";
const senderName = () => process.env.MAIL_FROM_NAME || "CS Student Guide";

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

// Brevo's HTTP API works on hosts that block SMTP (e.g. Render free tier)
const sendOneWithBrevo = async (
  email: string,
  { subject, html, text }: MailOptions,
) => {
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY as string,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail(), name: senderName() },
      to: [{ email }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`);
};

// Local fallback (Mailtrap) when no Brevo key is set
const sendOneWithSmtp = async (
  email: string,
  { subject, html, text }: MailOptions,
) => {
  const mailer = getTransporter();
  if (!mailer) throw new Error("SMTP is not configured");
  await mailer.sendMail({
    from: `"${senderName()}" <${senderEmail()}>`,
    to: email,
    subject,
    html,
    text,
  });
};

export const isEmailConfigured = (): boolean =>
  Boolean(process.env.BREVO_API_KEY || getTransporter());

/** Sends one copy per recipient (no shared addresses). Returns how many succeeded. */
export const sendMail = async (options: MailOptions): Promise<number> => {
  const recipients = [
    ...new Set(
      (Array.isArray(options.to) ? options.to : [options.to]).filter(Boolean),
    ),
  ];
  if (!isEmailConfigured()) {
    console.warn(`Email is not configured; skipping "${options.subject}"`);
    return 0;
  }

  const sendOne = process.env.BREVO_API_KEY
    ? sendOneWithBrevo
    : sendOneWithSmtp;
  let sent = 0;

  for (let i = 0; i < recipients.length; i += CONCURRENCY) {
    const batch = recipients.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((email) => sendOne(email, options)),
    );
    results.forEach((r, j) => {
      if (r.status === "fulfilled") sent++;
      else
        console.error(
          `Email to ${batch[j]} failed:`,
          r.reason instanceof Error ? r.reason.message : r.reason,
        );
    });
  }
  return sent;
};

// Stops HTML injection: an announcement containing <script> is shown as text
export const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string,
  );

const footer = `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
<p style="color:#64748b;font-size:13px;margin:0">Computer Science Department Student Guide</p>`;

export const sendAnnouncementEmail = async (
  emails: string[],
  title: string,
  message: string,
): Promise<void> => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#0f172a">
  <h2 style="color:#4338ca;margin:0 0 12px">${escapeHtml(title)}</h2>
  <p style="white-space:pre-line;line-height:1.6;margin:0">${escapeHtml(message)}</p>
  ${footer}
</div>`;

  const sent = await sendMail({
    to: emails,
    subject: `[CS Department] ${title}`,
    html,
    text: `${message}\n\n-- Computer Science Department Student Guide`,
  });
  console.log(
    `Announcement email delivered to ${sent} of ${emails.length} recipients`,
  );
};

export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  link: string,
  minutes: number,
): Promise<number> => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;color:#0f172a">
  <h2 style="color:#4338ca;margin:0 0 12px">Reset your password</h2>
  <p style="line-height:1.6">Hi ${escapeHtml(name)},</p>
  <p style="line-height:1.6">We received a request to reset your password. Click the button below to choose a new one. This link expires in ${minutes} minutes.</p>
  <p style="margin:24px 0">
    <a href="${link}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Reset password</a>
  </p>
  <p style="line-height:1.6;font-size:14px;color:#64748b">If the button doesn't work, copy this link into your browser:<br/>${link}</p>
  <p style="line-height:1.6;font-size:14px;color:#64748b">If you didn't ask for this, ignore this email. Your password won't change.</p>
  ${footer}
</div>`;

  return sendMail({
    to: email,
    subject: "Reset your CS Student Guide password",
    html,
    text: `Hi ${name},\n\nReset your password using this link (expires in ${minutes} minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
  });
};
