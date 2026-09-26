export const SITE_URL = "https://grade-flow-six.vercel.app";

const publicPages = {
  "/": {
    title: "GradeFlow | Academic analytics and GPA planning",
    description:
      "GradeFlow helps university students understand academic performance, plan grades, and manage their academic journey.",
    type: "WebSite",
  },
  "/about": {
    title: "About GradeFlow | Academic analytics for students",
    description:
      "Learn how GradeFlow brings academic analytics, grade planning, attendance tools, and degree progress into one student-focused experience.",
  },
  "/help": {
    title: "Help and support | GradeFlow",
    description:
      "Find practical help for using GradeFlow's academic planning and student tools, plus the available support contact.",
  },
  "/contact": {
    title: "Contact Support & Inquiries | GradeFlow",
    description:
      "Contact GradeFlow support, submit curriculum records, or report issues via email at jagan.parida.dev@gmail.com.",
  },
  "/privacy": {
    title: "Privacy Policy | GradeFlow",
    description:
      "Learn how GradeFlow safeguards student data, ensures privacy, and manages academic information responsibly.",
  },
  "/terms": {
    title: "Terms of Use | GradeFlow",
    description:
      "Read the official Terms of Use, acceptable use guidelines, and advisory notices for the GradeFlow platform.",
  },
  "/cookies": {
    title: "Cookie Policy | GradeFlow",
    description:
      "Understand how GradeFlow uses necessary authentication cookies and client storage for a secure, fast experience.",
  },
  "/about-dev": {
    title: "About the developer | GradeFlow",
    description:
      "Meet the developer behind GradeFlow and the student problem that inspired the application.",
  },
  "/resources": {
    title: "Academic resources | GradeFlow",
    description:
      "Explore GradeFlow's academic resources and GPA calculation guidance.",
  },
  "/testimonials": {
    title: "Student feedback | GradeFlow",
    description:
      "Read student feedback shared through GradeFlow.",
  },
};

const privateRoutePrefixes = [
  "/api",
  "/admin",
  "/dashboard",
  "/analytics",
  "/attendance",
  "/timetable",
  "/leaderboard",
  "/403",
  "/access-denied",
  "/maintenance",
  "/offline",
  "/session-expired",
  "/rate-limit",
  "/500",
  "/503",
];

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function removeMeta(attribute, name) {
  document.head.querySelector(`meta[${attribute}="${name}"]`)?.remove();
}

function setCanonical(pathname) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", `${SITE_URL}${pathname === "/" ? "/" : pathname}`);
}

function setStructuredData(page, pathname) {
  let element = document.getElementById("gradeflow-structured-data");
  if (!page) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.id = "gradeflow-structured-data";
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  const url = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
  element.textContent = JSON.stringify(
    page.type === "WebSite"
      ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "GradeFlow",
          url,
          description: page.description,
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: page.title,
          url,
          description: page.description,
        },
  );
}

export function applyRouteMetadata(pathname) {
  const page = publicPages[pathname];
  const isPrivate = privateRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!page) {
    document.title = isPrivate ? "GradeFlow | Private area" : "Page not found | GradeFlow";
    setMeta("name", "robots", "noindex, nofollow, noarchive");
    setMeta("name", "description", "This GradeFlow page is not available for indexing.");
    removeMeta("property", "og:title");
    removeMeta("property", "og:description");
    removeMeta("property", "og:url");
    document.head.querySelector('link[rel="canonical"]')?.remove();
    setStructuredData(null, pathname);
    return;
  }

  document.title = page.title;
  setMeta("name", "description", page.description);
  setMeta("name", "robots", "index, follow, max-image-preview:large");
  setMeta("property", "og:type", "website");
  setMeta("property", "og:site_name", "GradeFlow");
  setMeta("property", "og:title", page.title);
  setMeta("property", "og:description", page.description);
  setMeta("property", "og:url", `${SITE_URL}${pathname === "/" ? "/" : pathname}`);
  setMeta("property", "og:image", `${SITE_URL}/webisteLogo.png`);
  setMeta("name", "twitter:card", "summary");
  setMeta("name", "twitter:title", page.title);
  setMeta("name", "twitter:description", page.description);
  setCanonical(pathname);
  setStructuredData(page, pathname);
}
