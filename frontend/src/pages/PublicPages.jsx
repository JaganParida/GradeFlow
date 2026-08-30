import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Cookie,
  GraduationCap,
  MessageCircle,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import "./PublicPages.css";

const supportUrl =
  "https://wa.me/919124540575?text=Hello%20Jagan%2C%20I%20need%20help%20with%20GradeFlow.";

const footerLinks = [
  ["About", "/about"],
  ["Help", "/help"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Cookies", "/cookies"],
];

function OwnerReviewNotice() {
  return (
    <aside className="gf-public-owner-note" aria-labelledby="owner-review-title">
      <ShieldCheck size={20} aria-hidden="true" />
      <div>
        <h2 id="owner-review-title">Owner review still needed</h2>
        <p>
          The current application does not provide a legal owner or entity name, privacy email,
          postal address, data-retention schedule, list of deployment-specific service providers,
          or governing jurisdiction. The owner must supply and review those details before this
          notice is treated as a final legal policy.
        </p>
      </div>
    </aside>
  );
}

function PublicFooter() {
  return (
    <footer className="gf-public-footer">
      <div className="gf-public-footer-inner">
        <div>
          <Link className="gf-public-footer-brand" to="/" aria-label="GradeFlow home">
            <img src="/webisteLogo.png" alt="" width="36" height="36" />
            <span>GradeFlow</span>
          </Link>
          <p>Academic analytics and planning tools for university students.</p>
        </div>
        <nav aria-label="Public pages" className="gf-public-footer-links">
          {footerLinks.map(([label, to]) => (
            <Link key={to} to={to}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

function AboutPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-split">
        <div>
          <span className="gf-public-eyebrow">
            <GraduationCap size={15} aria-hidden="true" /> About GradeFlow
          </span>
          <h1>Academic planning, made easier to understand</h1>
          <p>
            GradeFlow is an academic analytics application for university students. It brings
            performance tracking, GPA planning, attendance tools, timetable information, and
            degree-progress views into one focused student experience.
          </p>
          <Link className="gf-public-button" to="/help">
            Get help using GradeFlow <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="gf-public-illustration" aria-hidden="true">
          <div className="gf-public-orbit gf-public-orbit-one" />
          <div className="gf-public-orbit gf-public-orbit-two" />
          <div className="gf-public-illustration-card">
            <GraduationCap size={44} />
            <span>GradeFlow</span>
            <small>Academic clarity</small>
          </div>
        </div>
      </section>

      <section className="gf-public-section" aria-labelledby="about-purpose">
        <div className="gf-public-section-heading">
          <span>Purpose</span>
          <h2 id="about-purpose">Turn academic information into practical next steps</h2>
        </div>
        <div className="gf-public-feature-grid">
          <article>
            <BookOpen size={22} aria-hidden="true" />
            <h3>Understand progress</h3>
            <p>Review academic performance and the information available for your student account.</p>
          </article>
          <article>
            <CheckCircle2 size={22} aria-hidden="true" />
            <h3>Plan with context</h3>
            <p>Use GPA, credit, placement, timetable, and attendance tools to plan upcoming work.</p>
          </article>
          <article>
            <ShieldCheck size={22} aria-hidden="true" />
            <h3>Keep records private</h3>
            <p>Student-specific academic information is available through the protected student area.</p>
          </article>
        </div>
      </section>

      <section className="gf-public-section gf-public-prose" aria-labelledby="about-accuracy">
        <h2 id="about-accuracy">A useful companion to official records</h2>
        <p>
          GradeFlow is designed to make academic information easier to work with. If you notice a
          discrepancy, compare it with your institution-issued record and use the available
          support channel to report the issue.
        </p>
      </section>
    </>
  );
}

function HelpPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <CircleHelp size={15} aria-hidden="true" /> Help and support
        </span>
        <h1>Find your way around GradeFlow</h1>
        <p>
          GradeFlow's student tools become available after you sign in to your own account. This
          short guide covers the public starting points and the support option currently provided.
        </p>
      </section>

      <section className="gf-public-section" aria-labelledby="help-start">
        <div className="gf-public-section-heading">
          <span>Getting started</span>
          <h2 id="help-start">A simple path through the application</h2>
        </div>
        <ol className="gf-public-steps">
          <li>
            <span>01</span>
            <div>
              <h3>Open the student sign-in</h3>
              <p>Use the sign-in option on the GradeFlow home page and follow the prompts for your account.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Use the tools tied to your account</h3>
              <p>Student dashboards, academic data, and planning tools remain in the protected area.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Check source records when needed</h3>
              <p>For any concern about academic information, compare it with the relevant official record first.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="gf-public-section gf-public-callout" aria-labelledby="help-contact">
        <MessageCircle size={24} aria-hidden="true" />
        <div>
          <h2 id="help-contact">Need to report an issue?</h2>
          <p>Use the available contact channel for questions about GradeFlow or a possible record discrepancy.</p>
          <Link to="/contact">View contact options <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}

function ContactPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <MessageCircle size={15} aria-hidden="true" /> Contact
        </span>
        <h1>Contact the GradeFlow developer</h1>
        <p>
          The application currently provides WhatsApp as its published support channel. No public
          email address or physical address is included in the project.
        </p>
      </section>

      <section className="gf-public-section" aria-labelledby="contact-channel">
        <article className="gf-public-contact-card">
          <MessageCircle size={28} aria-hidden="true" />
          <div>
            <h2 id="contact-channel">WhatsApp support</h2>
            <p>Message Jagan Parida, the GradeFlow developer, at +91 91245 40575.</p>
            <a className="gf-public-button" href={supportUrl} target="_blank" rel="noreferrer">
              Open WhatsApp <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </article>
        <p className="gf-public-contact-note">
          For your safety, do not send a password, OTP, or other sign-in secret through support.
        </p>
      </section>
    </>
  );
}

function PrivacyPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <ShieldCheck size={15} aria-hidden="true" /> Privacy policy
        </span>
        <h1>How the current GradeFlow application handles information</h1>
        <p>
          This page describes behavior visible in the application source. It is a plain-language
          summary, not a substitute for owner-supplied legal information.
        </p>
      </section>

      <section className="gf-public-prose gf-public-section" aria-labelledby="privacy-information">
        <h2 id="privacy-information">Information used by the application</h2>
        <p>
          GradeFlow processes student account and academic information needed to provide its
          protected student experience. This can include registration identifiers, account details,
          academic records, and information required to display the tools linked to that account.
        </p>
        <p>
          When sign-in and device-control features are used, the application also processes session
          information and device context such as browser, operating-system, device-type, and
          connection details. These are used by the implemented account-access and device-approval
          features.
        </p>

        <h2>How information is used</h2>
        <ul>
          <li>Authenticate a user and limit access to that user’s protected academic information.</li>
          <li>Display academic, timetable, attendance, notification, and planning features available to the account.</li>
          <li>Operate security, session, device, and service-maintenance features in the application.</li>
        </ul>

        <h2>Browser storage and session controls</h2>
        <p>
          GradeFlow uses essential session cookies for student and administrative access. It also
          uses browser storage for a theme choice, temporary maintenance information, feature
          preferences, and technical recovery state. The <Link to="/cookies">Cookie Policy</Link>
          {" "}has more detail.
        </p>

        <h2>Support requests</h2>
        <p>
          Selecting the published contact link opens WhatsApp. Messages sent there are handled
          through that external service as well as by the recipient; do not send passwords or OTPs.
        </p>

        <h2>What is not defined here</h2>
        <p>
          The application source does not publish a complete retention schedule, legal owner
          identity, rights-request process, or deployment-specific list of service providers. Those
          items need owner confirmation before this becomes a final privacy notice.
        </p>
      </section>
      <OwnerReviewNotice />
    </>
  );
}

function TermsPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <Scale size={15} aria-hidden="true" /> Terms of use
        </span>
        <h1>Use GradeFlow responsibly and only for authorized access</h1>
        <p>
          These terms set practical expectations for using the current GradeFlow web application.
          They need owner review before they are used as final legal terms.
        </p>
      </section>

      <section className="gf-public-prose gf-public-section" aria-labelledby="terms-use">
        <h2 id="terms-use">Appropriate use</h2>
        <ul>
          <li>Use the student area only for the account and academic information you are authorized to access.</li>
          <li>Do not attempt to access another person’s records, bypass access controls, or interfere with the service.</li>
          <li>Keep your sign-in information private and do not share passwords, OTPs, or session details.</li>
          <li>Use GradeFlow’s planning information alongside institution-issued records when confirmation is needed.</li>
        </ul>

        <h2>Availability and accuracy</h2>
        <p>
          GradeFlow provides academic tools and information available to the application. Timetables,
          academic records, calculations, and other displayed information should be checked against
          the relevant official source when a discrepancy or important decision is involved.
        </p>

        <h2>Feedback and contact</h2>
        <p>
          If you find a technical issue or possible discrepancy, use the published
          {" "}<Link to="/contact">contact channel</Link>. Do not include passwords or OTPs in a
          support message.
        </p>

        <h2>Owner information still required</h2>
        <p>
          The source does not provide the contracting entity, governing law, jurisdiction,
          formal notices address, or final dispute terms. The owner must add and approve those
          details before publication as final terms.
        </p>
      </section>
      <OwnerReviewNotice />
    </>
  );
}

function CookiesPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <Cookie size={15} aria-hidden="true" /> Cookie policy
        </span>
        <h1>Essential session cookies and browser storage</h1>
        <p>
          GradeFlow uses technical storage to maintain protected sessions and remember selected
          application behavior. This page reflects the current client and server source.
        </p>
      </section>

      <section className="gf-public-prose gf-public-section" aria-labelledby="cookie-uses">
        <h2 id="cookie-uses">Essential session cookies</h2>
        <p>
          The application sets <code>student_jwt</code> for student sessions and <code>jwt</code>
          {" "}for administrative sessions. The server configures these as HTTP-only cookies with a
          same-site setting; when the application is served securely, they are also marked secure.
          They support sign-in and protected access rather than advertising.
        </p>

        <h2>Local and session storage</h2>
        <p>
          The browser may store a theme preference, temporary maintenance information, technical
          retry state, selected feature preferences, timetable customizations, or similar
          application state. Some feature-specific entries are cleared by their associated action
          or during sign-out flows.
        </p>

        <h2>Analytics and advertising</h2>
        <p>
          No analytics or advertising script is present in the current front-end entry document or
          application source. The owner must re-check this statement if deployment settings or
          third-party tools change.
        </p>

        <h2>Managing storage</h2>
        <p>
          You can manage cookies and browser storage through your browser settings. Removing
          session cookies can sign you out in that browser and may affect access to protected
          GradeFlow features.
        </p>
      </section>
      <OwnerReviewNotice />
    </>
  );
}

const pageComponents = {
  about: AboutPage,
  help: HelpPage,
  contact: ContactPage,
  privacy: PrivacyPage,
  terms: TermsPage,
  cookies: CookiesPage,
};

export default function PublicPages({ page }) {
  const Page = pageComponents[page] || AboutPage;

  return (
    <main className="gf-public-page">
      <div className="gf-public-content">
        <Page />
      </div>
      <PublicFooter />
    </main>
  );
}
