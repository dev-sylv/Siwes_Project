export interface Faq {
  _id: string;
  question: string;
  answer: string;
  order: number;
}

// used by the admin "Add starter FAQs" button the first time, so the guide is not empty
export const STARTER_FAQS: { question: string; answer: string }[] = [
  {
    question: "Why can't I see an announcement for another level?",
    answer:
      "Announcements are either for everyone or for one level. You only see the ones meant for you.",
  },
  {
    question: "How do I become a course rep or the president?",
    answer:
      "Use the Request a role card on your dashboard, give a reason, and wait for an admin to approve it. Your menu updates after approval.",
  },
  {
    question: "I forgot my password. What do I do?",
    answer:
      "Use Forgot password on the sign-in page. A reset link is sent to your email and works once, for 30 minutes.",
  },
  {
    question: "The timetable is empty or wrong. Who fixes it?",
    answer:
      "Your course rep manages the timetable for your level. Tell them, or ask an admin if your level has no course rep yet.",
  },
];
