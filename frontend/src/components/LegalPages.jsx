
import { ArrowLeft, CalendarDays, Cookie, ShieldCheck } from 'lucide-react'
import './LegalPages.css'

// Replace this with an email address you actually monitor.
const CONTACT_EMAIL = 'opportunesupport@gmail.com'
const LAST_UPDATED = 'November 2, 2026'

function LegalLayout({ title, description, icon: Icon, children }) {
  return (
    <div className="legal-page">
      <header className="legal-navbar">
        <a href="/" className="legal-brand">
          <CalendarDays size={23} />
          <span>opportune.</span>
        </a>
        <a href="/" className="legal-home">
          <ArrowLeft size={17} /> Back to home
        </a>
      </header>

      <main className="legal-container">
        <div className="legal-heading">
          <span className="legal-heading-icon">
            <Icon size={27} />
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
          <small>Last updated: {LAST_UPDATED}</small>
        </div>

        <article className="legal-content">{children}</article>
      </main>

      <footer className="legal-footer">
        <span>© {new Date().getFullYear()} Opportune</span>
        <nav>
          <a href="/privacy">Privacy</a>
          <a href="/cookies">Cookies</a>
          <a href="/">Home</a>
        </nav>
      </footer>
    </div>
  )
}

export function PrivacyPolicyContent() {
  return (
    <>
      <section>
        <h2>1. About Opportune</h2>
        <p>
          Opportune is a web application that helps people organize
          scholarships, internships, jobs, grants, competitions and
          other opportunities. This policy explains how information
          is handled when you use the service at opportune.site.
        </p>
        <p>
          Opportune is operated from Rwanda. For privacy questions,
          contact us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <p>Depending on how you use Opportune, we process:</p>
        <ul>
          <li>
            <strong>Account information:</strong> details you provide
            to create an account, including your email address and
            authentication information.
          </li>
          <li>
            <strong>Opportunity information:</strong> links, pasted
            text, application deadlines, notes, statuses, required
            documents lists and other details you save.
          </li>
          <li>
            <strong>Email reminder information:</strong> verified
            email addresses and reminder preferences.
          </li>
          <li>
            <strong>Support information:</strong> your name, contact
            details and the messages you send to support.
          </li>
          <li>
            <strong>Technical information:</strong> information
            needed to operate and protect the service, such as
            request logs, IP addresses and error records.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use your information</h2>
        <p>We process information to:</p>
        <ul>
          <li>Create and secure your account.</li>
          <li>Verify email addresses and support password resets.</li>
          <li>Extract and organize opportunity details.</li>
          <li>Store your opportunities and application progress.</li>
          <li>Send requested email reminders.</li>
          <li>Respond to support requests.</li>
          <li>Detect abuse, troubleshoot errors and improve reliability.</li>
        </ul>
        <p>
          We process personal data where necessary to provide
          requested services, meet legal obligations, protect the
          service, or where another lawful basis applies.
        </p>
      </section>

      <section>
        <h2>4. AI-assisted extraction</h2>
        <p>
          When you request opportunity extraction, Opportune may
          retrieve content from the link you provide or process text
          you paste. Relevant content is sent to an AI service,
          including Google's Gemini service, to organize the details.
        </p>
        <p>
          Avoid pasting passwords, identity documents, sensitive
          personal information or confidential application materials.
          Always review extracted details before relying on them.
        </p>
      </section>

      <section>
        <h2>5. Service providers</h2>
        <p>
          Opportune uses external providers to operate the website,
          backend, database, email delivery and AI extraction.
          These include Vercel, Render, Neon, Brevo and Google
          Gemini, according to the services currently configured.
        </p>
        <p>
          Relevant information may be processed on infrastructure
          outside your country. Each provider's applicable terms
          and privacy practices also govern its processing.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          We use measures such as encrypted HTTPS connections,
          authentication controls, email verification, access
          restrictions and security monitoring to help protect
          information. No online service can guarantee absolute
          security.
        </p>
      </section>

      <section>
        <h2>7. Data retention</h2>
        <p>
          Account and saved opportunity information is generally
          retained while needed to provide the service. Technical
          records, support messages and backups may have different
          retention periods.
        </p>
        <p>
          You may contact us to request deletion of your information.
          We will assess requests in accordance with applicable law,
          including any information we must retain for legitimate
          or legal reasons.
        </p>
      </section>

      <section>
        <h2>8. Your privacy rights</h2>
        <p>
          Depending on applicable law, you may request access to
          your personal information, correction of inaccurate
          information, deletion, restriction of processing or
          information about how your data is handled.
        </p>
        <p>
          To make a request, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          You may also have the right to contact the relevant
          data-protection authority.
        </p>
      </section>

      <section>
        <h2>9. Cookies</h2>
        <p>
          Opportune uses cookies for functions such as secure
          authentication and protection against forged requests.
          Please read our <a href="/cookies">Cookie Policy</a> for
          more information.
        </p>
      </section>

      <section>
        <h2>10. Changes to this policy</h2>
        <p>
          We may update this policy as the service develops.
          Material changes will be communicated when appropriate.
          The latest revision date is shown at the top of this page.
        </p>
      </section>
        </>
  )
}

export function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="Your opportunities matter. Your privacy does too."
      icon={ShieldCheck}
    >
      <PrivacyPolicyContent />
    </LegalLayout>
  )
}

export function CookiePolicy() {
  return (
    <LegalLayout
      title="Cookie Policy"
      description="A simple explanation of how cookies help Opportune work."
      icon={Cookie}
    >
      <section>
        <h2>1. What are cookies?</h2>
        <p>
          Cookies are small pieces of information stored by your
          browser. They can help websites remember a session,
          maintain security or save preferences.
        </p>
      </section>

      <section>
        <h2>2. How Opportune uses cookies</h2>
        <p>
          Opportune uses essential cookies to support secure
          account sessions and protect sensitive requests.
        </p>

        <div className="legal-cookie-table">
          <table>
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Why it is used</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Authentication</td>
                <td>
                  Helps maintain your signed-in session securely.
                </td>
              </tr>
              <tr>
                <td>CSRF protection</td>
                <td>
                  Helps prevent unauthorized websites from
                  submitting certain requests on your behalf.
                </td>
              </tr>
              <tr>
                <td>Administration</td>
                <td>
                  Supports restricted administrative sessions
                  for authorized administrators.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3. Essential and optional cookies</h2>
        <p>
          Essential cookies are required for important features,
          including account authentication and security.
        </p>
        <p>
          If we introduce optional analytics, advertising or
          similar technologies in the future, we will update
          this policy and provide applicable choices or consent
          controls before using them.
        </p>
      </section>

      <section>
        <h2>4. Managing cookies</h2>
        <p>
          You can inspect, restrict or delete cookies through your
          browser settings. Blocking essential cookies may prevent
          sign-in, session restoration or other secure features
          from working correctly.
        </p>
      </section>

      <section>
        <h2>5. Third-party services</h2>
        <p>
          The service relies on external hosting and infrastructure
          providers. Their technologies may have separate privacy
          practices. We will review cookies and other browser
          storage used by our deployed services as they change.
        </p>
      </section>

      <section>
        <h2>6. Changes and contact</h2>
        <p>
          We may update this policy when our use of cookies
          changes. For questions, contact{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </LegalLayout>
  )
}
