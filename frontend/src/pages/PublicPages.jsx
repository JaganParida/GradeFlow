import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  Cookie,
  Copy,
  ExternalLink,
  GraduationCap,
  Headphones,
  Lock,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Clock,
  FileText,
  UserCheck,
} from "lucide-react";
import "./PublicPages.css";

const CONTACT_EMAIL = "jagan.parida.dev@gmail.com";

const footerLinks = [
  ["About", "/about"],
  ["Help", "/help"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Cookies", "/cookies"],
];

function CopyEmailButton({ email = CONTACT_EMAIL }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(email);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = email;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  return (
    <button
      type="button"
      className={`gf-copy-button ${copied ? "copied" : ""}`}
      onClick={handleCopy}
      aria-label="Copy email address"
      title="Copy email to clipboard"
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{copied ? "Copied!" : "Copy"}</span>
    </button>
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
          <p>
            Academic Analytics &bull; GPA Intelligence &bull; Degree Planning
            <br />
            Engineered for university students to track, predict, and optimize academic trajectories.
          </p>
          <div style={{ marginTop: 10, fontSize: "0.82rem", color: "#94a3b8" }}>
            &copy; 2026 GradeFlow. All rights reserved. &bull;{" "}
            <Link to="/about-dev" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              Built by Jagan Parida
            </Link>
          </div>
        </div>
        <nav aria-label="Public and legal pages" className="gf-public-footer-links">
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

/* ─────────────────────────────────────────────────────────────
   1. ABOUT PAGE
───────────────────────────────────────────────────────────── */
function AboutPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-split">
        <div>
          <span className="gf-public-eyebrow">
            <GraduationCap size={15} aria-hidden="true" /> About GradeFlow
          </span>
          <h1>Academic planning, engineered for student clarity</h1>
          <p>
            GradeFlow is an advanced academic analytics and planning platform for university students.
            It consolidates semester grades, GPA projections, attendance tracking, weekly schedules,
            and degree-progress baskets into one unified, elegant student experience.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            <Link className="gf-public-button" to="/help">
              Explore Help Center <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="gf-public-button-secondary" to="/about-dev">
              Meet the Developer
            </Link>
          </div>
        </div>
        <div className="gf-public-illustration" aria-hidden="true">
          <div className="gf-public-orbit gf-public-orbit-one" />
          <div className="gf-public-orbit gf-public-orbit-two" />
          <div className="gf-public-illustration-card">
            <GraduationCap size={44} />
            <span>GradeFlow</span>
            <small>Academic Intelligence</small>
          </div>
        </div>
      </section>

      <section className="gf-public-section" aria-labelledby="about-purpose">
        <div className="gf-public-section-heading">
          <span>Core Pillars</span>
          <h2 id="about-purpose">Designed from the ground up for university excellence</h2>
        </div>
        <div className="gf-public-feature-grid">
          <article>
            <BookOpen size={24} aria-hidden="true" />
            <h3>Complete Progress Clarity</h3>
            <p>
              Instantly view SGPA and CGPA trends across all completed semesters. Eliminate confusing
              university portal tables with clean, actionable visual insights.
            </p>
          </article>
          <article>
            <Sparkles size={24} aria-hidden="true" />
            <h3>Predictive Grade Modeling</h3>
            <p>
              Simulate semester targets with our interactive grade predictor. Know exactly what grades
              you need in upcoming exams to reach your target honors or placement cutoffs.
            </p>
          </article>
          <article>
            <ShieldCheck size={24} aria-hidden="true" />
            <h3>Privacy &amp; Security First</h3>
            <p>
              Academic information belongs to students. We enforce strict session security, zero
              commercial advertising trackers, and zero monetization of student records.
            </p>
          </article>
        </div>
      </section>

      <section className="gf-public-section gf-public-prose" aria-labelledby="about-companion">
        <h2 id="about-companion">An independent academic companion</h2>
        <p>
          GradeFlow was developed to give students immediate, intuitive access to their academic
          standing and degree requirements. While our calculation engines and algorithms are built
          for rigorous precision, GradeFlow serves as an auxiliary planning companion. Official
          university registrar records and published grade sheets remain the institutional record of truth.
        </p>
        <p>
          Need to report a calculation anomaly or submit syllabus documents for your branch?
          Visit our <Link to="/contact">Contact Page</Link> to connect directly with the GradeFlow team.
        </p>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. HELP & SUPPORT PAGE
───────────────────────────────────────────────────────────── */
function HelpPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <CircleHelp size={15} aria-hidden="true" /> Knowledge Base
        </span>
        <h1>GradeFlow Help &amp; Support Center</h1>
        <p>
          Find step-by-step guidance, feature walkthroughs, and answers to common questions to help
          you navigate GradeFlow with confidence.
        </p>
      </section>

      <section className="gf-public-section" aria-labelledby="help-guide">
        <div className="gf-public-section-heading">
          <span>Feature Walkthrough</span>
          <h2 id="help-guide">Getting the most out of GradeFlow</h2>
        </div>
        <ol className="gf-public-steps">
          <li>
            <span>01</span>
            <div>
              <h3>Sign In with Your Registration Number</h3>
              <p>
                Use the Student Sign-In portal on the homepage. Enter your university registration
                number to securely access your personalized dashboard and academic trajectory.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Track SGPA &amp; CGPA Evolution</h3>
              <p>
                Navigate to your Dashboard or Analytics to inspect grade trends, credit completions,
                semester-by-semester scores, and historical performance breakdowns.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Simulate Target Scores with Grade Predictor</h3>
              <p>
                Use the predictive tool to set future target GPAs. Enter your expected subject grades
                to calculate the required scores needed to attain your desired graduation standing.
              </p>
            </div>
          </li>
          <li>
            <span>04</span>
            <div>
              <h3>Monitor Timetables &amp; Attendance Safety</h3>
              <p>
                Access your weekly class schedule and calculate attendance margins so you always
                maintain safe attendance levels above mandatory university minimums.
              </p>
            </div>
          </li>
          <li>
            <span>05</span>
            <div>
              <h3>Explore Curriculum &amp; Syllabi</h3>
              <p>
                Browse the Resources library for official syllabus structures, department credit
                baskets, and previous question banks curated for your university branch.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="gf-public-section" aria-labelledby="help-faqs">
        <div className="gf-public-section-heading">
          <span>Frequently Asked Questions</span>
          <h2 id="help-faqs">Common Questions &amp; Answers</h2>
        </div>
        <div className="gf-faq-grid">
          <div className="gf-faq-card">
            <h3>What if my grades differ from the university portal?</h3>
            <p>
              GradeFlow synchronizes data from university grade distributions. If your university has
              recently updated grades due to rechecking or supplementary results, report the update via
              our contact channel so the database reflects the newest record.
            </p>
          </div>
          <div className="gf-faq-card">
            <h3>Can I access GradeFlow offline?</h3>
            <p>
              Yes. GradeFlow implements modern Progressive Web App (PWA) caching. Your latest loaded
              timetables and dashboard metrics remain accessible even when your internet connection is intermittent.
            </p>
          </div>
          <div className="gf-faq-card">
            <h3>How is my target SGPA calculated?</h3>
            <p>
              The Grade Predictor applies standard institutional credit-weighting algorithms, multiplying
              each course credit value by your simulated grade points to forecast your exact cumulative outcome.
            </p>
          </div>
          <div className="gf-faq-card">
            <h3>How do I suggest a feature or request a syllabus?</h3>
            <p>
              We continuously expand branch support. You can email syllabus PDFs or feature suggestions
              directly to our support team at <strong>{CONTACT_EMAIL}</strong>.
            </p>
          </div>
        </div>
      </section>

      <section className="gf-public-callout" aria-labelledby="help-support-contact">
        <Headphones size={26} aria-hidden="true" />
        <div>
          <h2 id="help-support-contact">Still need assistance?</h2>
          <p>
            Our support team is available to assist with account questions, record updates, or technical bugs.
            Reach out via email and we will be happy to assist.
          </p>
          <Link to="/contact">
            Go to Contact Page <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. CONTACT PAGE
───────────────────────────────────────────────────────────── */
function ContactPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <Headphones size={15} aria-hidden="true" /> Support &amp; Inquiries
        </span>
        <h1>Contact GradeFlow</h1>
        <p>
          Have a question, feedback, or need assistance with your academic records? Reach out to the
          GradeFlow team directly. We are dedicated to providing fast, reliable assistance to students.
        </p>
      </section>

      {/* Main Contact Channels Grid */}
      <section className="gf-public-section" aria-labelledby="contact-channels">
        <div className="gf-public-section-heading">
          <span>Direct Channels</span>
          <h2 id="contact-channels">How can we help you today?</h2>
        </div>

        <div className="gf-contact-grid">
          {/* Channel 1: General & Student Support */}
          <article className="gf-contact-channel-card">
            <div>
              <div className="gf-contact-channel-top">
                <div className="gf-contact-icon-box">
                  <Mail size={22} aria-hidden="true" />
                </div>
                <div className="gf-contact-channel-info">
                  <h3>Student Support &amp; Helpdesk</h3>
                  <p>Inquiries regarding account access, grade calculations, attendance, or platform issues.</p>
                </div>
              </div>

              <div className="gf-contact-email-pill">
                <span>{CONTACT_EMAIL}</span>
                <CopyEmailButton email={CONTACT_EMAIL} />
              </div>

              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "8px 0 16px" }}>
                <Clock size={13} style={{ verticalAlign: "middle", marginRight: 5, color: "#2563eb" }} />
                Typical turnaround: 24&ndash;48 business hours
              </p>
            </div>

            <div className="gf-contact-channel-footer">
              <a
                className="gf-public-button"
                href={`mailto:${CONTACT_EMAIL}?subject=GradeFlow%20Student%20Support%20Inquiry`}
              >
                Send Email <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </article>

          {/* Channel 2: Academic Records & Syllabus Submissions */}
          <article className="gf-contact-channel-card">
            <div>
              <div className="gf-contact-channel-top">
                <div className="gf-contact-icon-box">
                  <BookOpen size={22} aria-hidden="true" />
                </div>
                <div className="gf-contact-channel-info">
                  <h3>Syllabus &amp; Academic Data</h3>
                  <p>Submit official syllabus documents, branch elective structures, or report grade anomalies.</p>
                </div>
              </div>

              <div className="gf-contact-email-pill">
                <span>{CONTACT_EMAIL}</span>
                <CopyEmailButton email={CONTACT_EMAIL} />
              </div>

              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "8px 0 16px" }}>
                <FileText size={13} style={{ verticalAlign: "middle", marginRight: 5, color: "#2563eb" }} />
                Attach official PDF structures or curriculum sheets
              </p>
            </div>

            <div className="gf-contact-channel-footer">
              <a
                className="gf-public-button"
                href={`mailto:${CONTACT_EMAIL}?subject=GradeFlow%20Syllabus%20%26%20Curriculum%20Submission`}
              >
                Submit Curriculum <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </article>

          {/* Channel 3: Security & Bug Disclosure */}
          <article className="gf-contact-channel-card">
            <div>
              <div className="gf-contact-channel-top">
                <div className="gf-contact-icon-box">
                  <Lock size={22} aria-hidden="true" />
                </div>
                <div className="gf-contact-channel-info">
                  <h3>Security &amp; Bug Disclosure</h3>
                  <p>Spotted a calculation error, UI defect, or security vulnerability? Report it responsibly.</p>
                </div>
              </div>

              <div className="gf-contact-email-pill">
                <span>{CONTACT_EMAIL}</span>
                <CopyEmailButton email={CONTACT_EMAIL} />
              </div>

              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "8px 0 16px" }}>
                <ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 5, color: "#2563eb" }} />
                Reviewed directly by the developer
              </p>
            </div>

            <div className="gf-contact-channel-footer">
              <a
                className="gf-public-button"
                href={`mailto:${CONTACT_EMAIL}?subject=GradeFlow%20Security%20or%20Bug%20Report`}
              >
                Report Security Issue <ArrowRight size={15} aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>

        {/* Security Warning Notice */}
        <aside className="gf-security-notice" role="alert">
          <AlertTriangle size={22} aria-hidden="true" />
          <div>
            <h4>Security Reminder</h4>
            <p>
              For your safety, never share your university portal passwords, one-time passwords (OTPs),
              or active session credentials in email messages. GradeFlow representatives will never ask for your passwords.
            </p>
          </div>
        </aside>
      </section>

      {/* Helpful Guidelines for Contacting */}
      <section className="gf-public-section gf-public-prose" aria-labelledby="contact-guidelines">
        <h2 id="contact-guidelines">Information to include when contacting support</h2>
        <p>
          To help us resolve your query as swiftly as possible, please include the following details in your message:
        </p>
        <ul>
          <li><strong>Registration Number:</strong> Your university roll number (if inquiring about your account data).</li>
          <li><strong>Branch &amp; Semester:</strong> Your engineering/degree discipline and current semester.</li>
          <li><strong>Clear Description:</strong> A summary of the question, anomaly, or feature request.</li>
          <li><strong>Screenshots / Documents:</strong> If reporting a grade discrepancy, attach a screenshot of the official result sheet for quick verification.</li>
        </ul>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. PRIVACY POLICY PAGE
───────────────────────────────────────────────────────────── */
function PrivacyPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <ShieldCheck size={15} aria-hidden="true" /> Legal &amp; Transparency
        </span>
        <h1>GradeFlow Privacy Policy</h1>
        <p>
          Our commitment to safeguarding student data and maintaining complete transparency
          in how academic information is treated across the GradeFlow platform.
        </p>
        <div className="gf-legal-meta">
          <span className="gf-legal-meta-badge">
            <CheckCircle2 size={13} aria-hidden="true" /> Enterprise Standard
          </span>
          <span>Effective Date: September 26, 2026</span>
          <span>&bull;</span>
          <span>Last Updated: September 26, 2026</span>
        </div>
      </section>

      {/* Highlights Box */}
      <div className="gf-legal-highlights">
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <ShieldCheck size={20} aria-hidden="true" />
            <h3>Zero Ad Tracking</h3>
          </div>
          <p>We do not sell, rent, or monetize student personal or academic data to third-party advertisers or data brokers.</p>
        </div>
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <Lock size={20} aria-hidden="true" />
            <h3>Encryption in Transit</h3>
          </div>
          <p>All client-server communications are transmitted over modern TLS/HTTPS encryption protocols.</p>
        </div>
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <UserCheck size={20} aria-hidden="true" />
            <h3>Student Data Rights</h3>
          </div>
          <p>You retain full rights to your data. Request complete record export or account erasure at any time.</p>
        </div>
      </div>

      {/* Articles */}
      <section className="gf-public-section" aria-label="Privacy Policy Articles">
        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">01</span>
            <h2>Introduction &amp; Scope</h2>
          </div>
          <p>
            GradeFlow (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the academic intelligence
            and GPA planning platform available at grade-flow-six.vercel.app. We respect the privacy of every
            student who accesses our services. This Privacy Policy outlines our transparent data handling
            standards, the categories of information processed, and the measures we employ to safeguard student records.
          </p>
          <p>
            By using GradeFlow, you acknowledge the collection and processing of information strictly in
            accordance with this policy.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">02</span>
            <h2>Information We Process</h2>
          </div>
          <p>
            GradeFlow collects only the minimal data required to provide its academic analytics, degree
            tracking, and schedule tools:
          </p>
          <ul>
            <li>
              <strong>Academic Information:</strong> Student registration number, department or branch,
              semester course codes, credit allocations, letter grades, and attendance metrics voluntarily
              provided or synchronized to enable degree calculations.
            </li>
            <li>
              <strong>Operational &amp; Diagnostic Telemetry:</strong> Anonymized HTTP headers, browser environment
              details (for responsive rendering across mobile and desktop displays), and system error logs strictly
              necessary for uptime monitoring, rate-limiting, and abuse prevention.
            </li>
          </ul>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">03</span>
            <h2>How Information Is Utilized</h2>
          </div>
          <p>We process information solely for authentic academic and platform functionality:</p>
          <ul>
            <li>To compute accurate SGPA, CGPA, and cumulative credit totals.</li>
            <li>To simulate target score requirements in the interactive Grade Predictor.</li>
            <li>To display personalized weekly timetables and attendance threshold alerts.</li>
            <li>To authenticate authorized student sessions and prevent unauthorized profile access.</li>
            <li>To maintain platform security, prevent distributed denial-of-service (DDoS) attempts, and debug technical errors.</li>
          </ul>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">04</span>
            <h2>Data Protection &amp; Security Controls</h2>
          </div>
          <p>
            We implement comprehensive technical and organizational safeguards to protect student data against
            unauthorized access, alteration, or disclosure:
          </p>
          <ul>
            <li><strong>Transport Encryption:</strong> All data transmitted between your browser and our servers is secured with TLS 1.3 encryption.</li>
            <li><strong>Secure Session Management:</strong> Authentication tokens are stored using security-hardened HTTP-only, secure, and same-site flags to mitigate token theft and cross-site scripting vulnerabilities.</li>
            <li><strong>Access Controls:</strong> Administrative capabilities are strictly segregated using least-privilege principles and token authorization.</li>
            <li><strong>No Ad Trackers:</strong> We do not deploy third-party advertising cookies, marketing pixels, or commercial tracking tags.</li>
          </ul>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">05</span>
            <h2>Infrastructure &amp; Third-Party Services</h2>
          </div>
          <p>
            GradeFlow relies on enterprise-tier cloud infrastructure providers (including cloud hosting platforms
            and managed databases) that adhere to internationally recognized security standards (such as SOC-2
            and ISO/IEC 27001). These infrastructure partners process operational data solely on our behalf under
            strict data confidentiality and security obligations.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">06</span>
            <h2>Data Retention &amp; Erasure Rights</h2>
          </div>
          <p>
            Academic information is retained solely for the duration of the student&rsquo;s academic journey
            to maintain longitudinal analytics. You possess the right to request permanent deletion of your
            records at any time. To request account deletion or data erasure, email our privacy team at{" "}
            <strong>{CONTACT_EMAIL}</strong>, and your data will be permanently purged within 30 days.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">07</span>
            <h2>Student Rights</h2>
          </div>
          <p>As a student user of GradeFlow, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Inspect all academic information stored in connection with your account.</li>
            <li><strong>Rectification:</strong> Request correction of misaligned course codes, credits, or grade figures.</li>
            <li><strong>Erasure:</strong> Request permanent removal of your student data and cached information.</li>
          </ul>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">08</span>
            <h2>Policy Updates &amp; Contact</h2>
          </div>
          <p>
            We may periodically revise this Privacy Policy to reflect technological improvements or regulatory
            updates. Revisions will be published on this page with an updated timestamp.
          </p>
          <p>
            For privacy inquiries, data requests, or security disclosures, contact our privacy officer at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#2563eb", fontWeight: 700 }}>
              {CONTACT_EMAIL}
            </a>.
          </p>
        </article>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. TERMS OF USE PAGE
───────────────────────────────────────────────────────────── */
function TermsPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <Scale size={15} aria-hidden="true" /> Terms &amp; Conditions
        </span>
        <h1>GradeFlow Terms of Use</h1>
        <p>
          These Terms of Use govern your access to and use of the GradeFlow academic analytics platform.
          Please read them carefully before accessing the service.
        </p>
        <div className="gf-legal-meta">
          <span className="gf-legal-meta-badge">
            <CheckCircle2 size={13} aria-hidden="true" /> Enterprise Standard
          </span>
          <span>Effective Date: September 26, 2026</span>
          <span>&bull;</span>
          <span>Last Updated: September 26, 2026</span>
        </div>
      </section>

      {/* Highlights Box */}
      <div className="gf-legal-highlights">
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <GraduationCap size={20} aria-hidden="true" />
            <h3>Academic Companion</h3>
          </div>
          <p>GradeFlow is an auxiliary planning tool. Official university transcripts remain the sole legal record of truth.</p>
        </div>
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <ShieldCheck size={20} aria-hidden="true" />
            <h3>Authorized Access</h3>
          </div>
          <p>Users must access only their own student accounts and maintain responsible platform usage.</p>
        </div>
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <Scale size={20} aria-hidden="true" />
            <h3>Respectful Community</h3>
          </div>
          <p>Reverse-engineering, automated scraping, bot deployment, and unauthorized probing are strictly prohibited.</p>
        </div>
      </div>

      {/* Articles */}
      <section className="gf-public-section" aria-label="Terms of Use Articles">
        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">01</span>
            <h2>Acceptance of Terms</h2>
          </div>
          <p>
            By accessing or using GradeFlow, you confirm that you have read, understood, and agreed to be
            bound by these Terms of Use and our <Link to="/privacy">Privacy Policy</Link>. If you do not
            agree to these terms, please discontinue your use of the platform.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">02</span>
            <h2>Nature of the Service &amp; Advisory Notice</h2>
          </div>
          <p>
            GradeFlow is an independent academic productivity application developed to help university students
            visualize academic progress, calculate SGPA/CGPA scenarios, track degree completion, and manage
            timetables.
          </p>
          <div className="gf-legal-callout-box">
            <strong>Institutional Disclaimer:</strong> GradeFlow is not an official registrar or examination
            portal of the university. GradeFlow calculations, projections, and metrics are advisory planning tools.
            In all cases, official institutional grade sheets, university registry documents, and registrar transcripts
            remain the sole authoritative and definitive record of academic status.
          </div>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">03</span>
            <h2>Authorized Use &amp; Account Integrity</h2>
          </div>
          <p>Users of GradeFlow agree to:</p>
          <ul>
            <li>Access the platform solely with their own legitimate student registration credentials.</li>
            <li>Maintain the confidentiality of their session access and not share authentication credentials.</li>
            <li>Notify the GradeFlow team immediately if any unauthorized access or security anomaly is detected.</li>
          </ul>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">04</span>
            <h2>Prohibited Conduct</h2>
          </div>
          <p>When using GradeFlow, you expressly agree not to:</p>
          <ul>
            <li>Attempt to access, view, or modify the records of any other student without authorization.</li>
            <li>Deploy automated scripts, bots, spiders, or scrapers that place disproportionate load on server resources.</li>
            <li>Reverse-engineer, decompile, or attempt to extract the underlying source code of restricted components.</li>
            <li>Circumvent or attempt to tamper with security controls, rate limiters, or authentication mechanisms.</li>
            <li>Transmit any malicious code, viruses, or payloads harmful to the platform or its users.</li>
          </ul>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">05</span>
            <h2>Intellectual Property</h2>
          </div>
          <p>
            All platform interfaces, proprietary algorithms, predictive models, visual designs, brand assets,
            and software code are the intellectual property of GradeFlow and its developer, Jagan Parida.
            Except as expressly authorized, no portion of GradeFlow may be reproduced or distributed without
            prior written authorization.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">06</span>
            <h2>Service Availability &amp; Maintenance</h2>
          </div>
          <p>
            GradeFlow is committed to maximizing platform uptime and responsiveness. However, the service is
            provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. We reserve the right to perform
            routine maintenance, deploy software upgrades, or adjust feature sets without prior liability.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">07</span>
            <h2>Limitation of Liability</h2>
          </div>
          <p>
            To the maximum extent permitted by applicable law, GradeFlow and its developers shall not be liable
            for any indirect, incidental, special, or consequential damages resulting from academic planning decisions,
            network downtime, reliance on predictive models, or discrepancies between GradeFlow and official records.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">08</span>
            <h2>Modifications &amp; Contact</h2>
          </div>
          <p>
            We may update these Terms of Use periodically. Your continued use of GradeFlow following the posting
            of modifications constitutes your acceptance of the revised terms.
          </p>
          <p>
            For questions regarding these Terms, contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#2563eb", fontWeight: 700 }}>
              {CONTACT_EMAIL}
            </a>.
          </p>
        </article>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. COOKIE POLICY PAGE
───────────────────────────────────────────────────────────── */
function CookiesPage() {
  return (
    <>
      <section className="gf-public-hero gf-public-hero-compact">
        <span className="gf-public-eyebrow">
          <Cookie size={15} aria-hidden="true" /> Technical Storage
        </span>
        <h1>GradeFlow Cookie Policy</h1>
        <p>
          Learn how GradeFlow uses necessary authentication cookies and modern client storage
          technologies to ensure a fast, secure, and tailored user experience.
        </p>
        <div className="gf-legal-meta">
          <span className="gf-legal-meta-badge">
            <CheckCircle2 size={13} aria-hidden="true" /> Enterprise Standard
          </span>
          <span>Effective Date: September 26, 2026</span>
          <span>&bull;</span>
          <span>Last Updated: September 26, 2026</span>
        </div>
      </section>

      {/* Highlights Box */}
      <div className="gf-legal-highlights">
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <ShieldCheck size={20} aria-hidden="true" />
            <h3>Essential Authentication</h3>
          </div>
          <p>Session cookies are used strictly to maintain secure student logins and prevent unauthorized session tampering.</p>
        </div>
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <Lock size={20} aria-hidden="true" />
            <h3>Zero Advertising Pixels</h3>
          </div>
          <p>GradeFlow does not embed third-party advertising cookies, marketing pixels, or behavioral cross-site trackers.</p>
        </div>
        <div className="gf-legal-highlight-card">
          <div className="gf-legal-highlight-card-header">
            <Sparkles size={20} aria-hidden="true" />
            <h3>Offline Performance</h3>
          </div>
          <p>Modern browser caching powers instant schedule lookups and reliable offline timetable access.</p>
        </div>
      </div>

      {/* Articles */}
      <section className="gf-public-section" aria-label="Cookie Policy Articles">
        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">01</span>
            <h2>What Are Cookies and Storage Technologies?</h2>
          </div>
          <p>
            Cookies and web storage technologies (including HTML5 LocalStorage and SessionStorage) are small
            data units saved by your web browser. They enable web applications to remember your authenticated
            status, preserve your display preferences across visits, and ensure smooth, responsive navigation.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">02</span>
            <h2>How GradeFlow Utilizes Storage</h2>
          </div>
          <p>GradeFlow uses storage technologies strictly for functional, security, and performance purposes:</p>
          <ul>
            <li>
              <strong>Essential Session Cookies:</strong> Used exclusively to authenticate active student sessions,
              verify authorization for protected dashboard routes, and protect against Cross-Site Request Forgery (CSRF).
              These cookies are configured with security attributes (HTTP-only, Secure, and SameSite).
            </li>
            <li>
              <strong>Preference Storage (LocalStorage):</strong> Preserves your interface customization, such as
              your preferred theme (light mode or dark mode), collapsed sidebar states, and selected semester filters,
              so your workspace is instantly ready on every visit.
            </li>
            <li>
              <strong>Performance &amp; Offline Caching:</strong> Progressive Web App (PWA) service worker caches
              store static assets and timetable records locally, allowing you to check your schedule even when
              university Wi-Fi or cellular networks are weak.
            </li>
          </ul>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">03</span>
            <h2>No Third-Party Advertising Trackers</h2>
          </div>
          <p>
            GradeFlow is an academic utility built for students, not an ad-supported platform. We do not integrate
            commercial ad networks (such as Google AdSense or Meta Pixel) or monetize your browsing patterns.
            Your academic journey is never tracked across other web properties.
          </p>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">04</span>
            <h2>Managing and Disabling Cookies</h2>
          </div>
          <p>
            You have full control over cookies and browser storage. Most modern browsers (Chrome, Firefox, Safari,
            Edge) allow you to view, block, or delete cookies via their Settings or Preferences menu (typically
            under &ldquo;Privacy &amp; Security&rdquo;).
          </p>
          <div className="gf-legal-callout-box">
            <strong>Important Note:</strong> Because session cookies are strictly necessary for authenticating your
            student identity, clearing or blocking essential cookies will sign you out of GradeFlow and prevent access
            to protected dashboard features until you sign in again.
          </div>
        </article>

        <article className="gf-legal-article">
          <div className="gf-legal-article-header">
            <span className="gf-legal-article-number">05</span>
            <h2>Inquiries</h2>
          </div>
          <p>
            If you have questions regarding our cookie practices or browser storage management, please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#2563eb", fontWeight: 700 }}>
              {CONTACT_EMAIL}
            </a>.
          </p>
        </article>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROUTING DISPATCHER
───────────────────────────────────────────────────────────── */
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
