
import { useState } from "react";
import api from "../services/api";
import"../HelpSupport.css";

const tips = [
  {
    number: "01",
    title: "Save an opportunity",
    description:
      "Open Add Opportunity, enter the opportunity details, and save it to your collection.",
  },
  {
    number: "02",
    title: "Use AI extraction",
    description:
      "Paste an opportunity link and let Opportune help extract details. Review the information before saving.",
  },
  {
    number: "03",
    title: "Keep favorites close",
    description:
      "Mark interesting opportunities as favorites so you can find them quickly later.",
  },
  {
    number: "04",
    title: "Watch your deadlines",
    description:
      "Check the Deadlines section regularly and prioritize opportunities closing soon.",
  },
  {
    number: "05",
    title: "Update your progress",
    description:
      "Update an opportunity's status as you plan, work on, submit, or receive a decision on an application.",
  },
];

export default function HelpSupport() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

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
    setLoading(true);
    setFeedback({ type: "", message: "" });

    try {
      const response = await api.post("/support/contact/", form);

      setFeedback({
        type: "success",
        message:
          response.data?.detail ||
          "Your message has been sent successfully.",
      });

      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
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
      <header className="help-header">
        <p className="help-eyebrow">WE'RE HERE TO HELP</p>
        <h1>Help & Support</h1>
        <p>
          Everything you need to get more out of Opportune.
          Need a hand? Send us a message below.
        </p>
      </header>

      <section className="help-section">
        <div className="help-section-heading">
          <span className="help-section-icon">✦</span>
          <div>
            <h2>How to use Opportune</h2>
            <p>Five simple ways to stay on top of your opportunities.</p>
          </div>
        </div>

        <div className="help-tips-grid">
          {tips.map((tip) => (
            <article className="help-tip-card" key={tip.number}>
              <span className="help-tip-number">{tip.number}</span>
              <h3>{tip.title}</h3>
              <p>{tip.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="help-contact-section">
        <div className="help-contact-copy">
          <p className="help-eyebrow">CONTACT US</p>
          <h2>How can we help you?</h2>
          <p>
            Have a problem, suggestion, or question? Tell us what happened
            and we'll receive your message by email.
          </p>
          <div className="help-contact-note">
            <span aria-hidden="true">✉</span>
            <span>Your message goes directly to the Opportune support inbox.</span>
          </div>
        </div>

        <form className="help-contact-form" onSubmit={handleSubmit}>
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
            {loading ? "Sending..." : "Send message"}
            {!loading && <span aria-hidden="true"> ↗</span>}
          </button>
        </form>
      </section>

      <footer className="help-footer">
        <div>
          <h3>Opportune</h3>
          <p>Find opportunities. Stay prepared. Make your next move.</p>
        </div>

        <div className="help-social-links">
          <span>Follow Opportune</span>
          <a
            href="https://www.instagram.com/your-username/"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/company/your-company/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a
            href="https://www.facebook.com/your-page/"
            target="_blank"
            rel="noreferrer"
          >
            Facebook
          </a>
        </div>

        <p className="help-copyright">
          © {new Date().getFullYear()} Opportune. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
