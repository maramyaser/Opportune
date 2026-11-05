
import { useState } from "react";
import api from "../services/api";
import "../HelpSupport.css";

const tips = [
  {
    number: "01",
    title: "Save your first opportunity",
    description:
      "Click Add Opportunity, paste a link or enter the details manually, review the information, and click Save Opportunity. Your opportunity will appear in your dashboard.",
  },
  {
    number: "02",
    title: "Extract details with AI ✦",
    description:
      "Found a scholarship, internship, job, or competition? Paste its website link and click Extract. Opportune will help identify the title, organization, deadline, eligibility, and required documents. Always review the results before saving.",
  },
  {
    number: "03",
    title: "When extraction doesn't work",
    description:
      "Some websites, including certain social media and opportunity websites, block automated access. If a link fails, copy the opportunity description from the website, select Paste Text, and extract from the text instead.",
  },
  {
    number: "04",
    title: "Never forget a deadline",
    description:
      "Open Email Reminders, choose the email address where you want notifications, and complete email verification. Configure your reminder preferences to receive notifications about upcoming deadlines.",
  },
  {
    number: "05",
    title: "Organize your applications",
    description:
      "Update an opportunity's status as you make progress: Saved, Planning to Apply, In Progress, Submitted, Accepted, or Rejected. This helps you see which applications still need attention.",
  },
  {
    number: "06",
    title: "Find opportunities faster",
    description:
      "Use the search bar and category filters to find saved opportunities. Mark important ones as favorites, and check the Deadlines section to see which applications are closing soon.",
  },
];

const faqs = [
  {
    question: "Is Opportune free to use?",
    answer:
      "Opportune is currently available for beta testing. We'll communicate any future changes to access or pricing.",
  },
  {
    question: "Why isn't AI extraction working?",
    answer:
      "Some websites block automated access or contain content that is difficult to extract. Try copying the opportunity description and using the Paste Text option instead.",
  },
  {
    question: "Can I edit an opportunity after saving it?",
    answer:
      "Yes! Open your saved opportunity to edit its details, update its deadline, or change its application status.",
  },
  {
    question: "How do email reminders work?",
    answer:
      "Open Email Reminders, connect your preferred email address, complete verification, and configure your reminder preferences.",
  },
  {
    question: "What if AI extracts incorrect information?",
    answer:
      "AI-generated details may contain mistakes. Review the deadline, eligibility, required documents, and application link against the official opportunity announcement. You can correct the details before saving.",
  },
  {
    question: "How can I report a bug or request a feature?",
    answer:
      "Use the contact form below. Describe what happened, what you expected, and any error message you received. Never include passwords or verification codes.",
  },
];

const emptyForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function HelpSupport() {
  const [form, setForm] = useState({ ...emptyForm });

  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState({
    type: "",
    message: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const response = await api.post("/support/contact/", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setFeedback({
        type: "success",
        message:
          response.data?.detail ||
          "Your message has been sent successfully!",
      });

      setForm({ ...emptyForm });
    } catch (error) {
      console.error("Contact support failed:", error);

      setFeedback({
        type: "error",
        message:
          error.response?.data?.detail ||
          "We couldn't send your message. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="help-page">
      {/* PAGE HEADER */}
      <header className="help-header">
        <p></p>

        <h1>Help & Support</h1>

        <p>
        </p>
      </header>

      {/* TIPS SECTION */}
      <section className="help-section">
        <div className="help-section-heading">
          <span className="help-section-icon">✦</span>

          <div>
            <h2>How to use Opportune</h2>

            <p>
              Your guide to saving opportunities, using AI,
              managing deadlines, and staying organized.
            </p>
          </div>
        </div>

        <div className="help-tips-grid">
          {tips.map((tip) => (
            <article
              className="help-tip-card"
              key={tip.number}
            >
              <span className="help-tip-number">
                {tip.number}
              </span>

              <h3>{tip.title}</h3>

              <p>{tip.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="help-section help-faq-section">
        <div className="help-section-heading">
          <span className="help-section-icon">?</span>

          <div>
            <h2>Frequently Asked Questions</h2>

            <p>
              Quick answers to common questions about Opportune.
            </p>
          </div>
        </div>

        <div className="help-faq-list">
          {faqs.map((faq, index) => (
            <details key={index}>
              <summary>{faq.question}</summary>

              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CONTACT SUPPORT SECTION */}
      <section className="help-contact-section">
        <div className="help-contact-copy">
          <p className="help-eyebrow">
            CONTACT US ✉
          </p>

          <h2>How can we help you?</h2>

          <p>
            Having trouble using Opportune? Found a bug?
            Have a suggestion for a new feature?
          </p>

          <p>
            Tell us what happened, and we'll do our best
            to help you.
          </p>

          <div className="help-contact-note">
            <span aria-hidden="true">✉</span>

            <span>
              Your message will be sent to the
              Opportune support team.
            </span>
          </div>
        </div>

        <form
          className="help-contact-form"
          onSubmit={handleSubmit}
        >
          <div className="help-form-row">
            <label>
              Your name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                maxLength={100}
                autoComplete="name"
                disabled={loading}
                required
              />
            </label>

            <label>
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                maxLength={254}
                autoComplete="email"
                disabled={loading}
                required
              />
            </label>
          </div>

          <label>
            Subject
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="What do you need help with?"
              maxLength={150}
              disabled={loading}
              required
            />
          </label>

          <label>
            Your message
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Describe your problem or share your suggestion..."
              rows={5}
              maxLength={5000}
              disabled={loading}
              required
            />
          </label>

          {feedback.message && (
            <p
              className={`help-feedback ${feedback.type}`}
              role="status"
              aria-live="polite"
            >
              {feedback.message}
            </p>
          )}

          <button
            type="submit"
            className="help-submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                Sending...
                <span aria-hidden="true"> ⏳</span>
              </>
            ) : (
              <>
                Send message
                <span aria-hidden="true"> ↗</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
