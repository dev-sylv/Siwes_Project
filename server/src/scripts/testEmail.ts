import "dotenv/config";
import { sendMail } from "../utils/mailer";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run test:email -- you@example.com");
  process.exit(1);
}

sendMail({
  to,
  subject: "CS Student Guide: test email",
  html: "<p>If you can read this, email sending works.</p>",
  text: "If you can read this, email sending works.",
})
  .then((n) => {
    console.log(`Sent ${n} email(s).`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
