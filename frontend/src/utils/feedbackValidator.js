/**
 * GradeFlow Advanced Quality, Anti-Gibberish, Anti-Toxicity, Annoyance/Complaint & Defamation Validator
 * Strictly blocks spam, random letter smashing (e.g. "jkdbkb"), repeated characters,
 * profanity, abusive terms, toxic insults, defamation, complaint/irritation words,
 * placeholder names, and leetspeak evasions.
 * Enforces a minimum of 3 meaningful words per submission.
 */

// Profanity, vulgarities, slurs (English + Hindi/Hinglish)
const PROFANITY_TERMS = [
  "fuck", "fucker", "fucking", "bitch", "asshole", "bastard",
  "cunt", "dick", "pussy", "shit", "bullshit", "crap",
  "chutiya", "chutiye", "madarchod", "bhenchod", "behenchod",
  "gandu", "harami", "lauda", "lund", "kutta", "kamina",
  "bhosdi", "bhosdike", "gaand", "saala", "randi", "mc", "bc"
];

// Toxic, disparaging, defamatory & hostile accusations
const TOXIC_DEFAMATORY_TERMS = [
  "bakwas", "ghatiya", "faltu", "bekar", "thirdclass", "pathetic",
  "scam", "scammer", "fraud", "chor", "thief", "cheat", "cheater",
  "fake", "loot", "looting", "trash", "garbage", "rubbish", "loser",
  "worst", "disgusting", "horrible", "terrible", "sucks"
];

// Negative annoyance, complaint & process-disparaging terms (e.g. "Very irritating process")
const COMPLAINT_ANNOYANCE_TERMS = [
  "irritating", "irritated", "irritate", "irritation",
  "annoying", "annoyed", "annoy", "annoyance",
  "frustrating", "frustrated", "frustration",
  "painful", "headache", "disaster", "ridiculous", "nonsense",
  "useless", "hopeless", "boring", "tiring", "exhausting",
  "stupid", "dumb", "idiot", "glitchy", "buggy", "broken",
  "hanging", "laggy", "unbearable", "torture"
];

// Generic / fake name placeholders that should not be used in feedback
const FAKE_NAME_TERMS = [
  "anonymous", "anyname", "unknown", "nobody", "someone"
];

const ALL_BLOCKED_TERMS = [
  ...PROFANITY_TERMS,
  ...TOXIC_DEFAMATORY_TERMS,
  ...COMPLAINT_ANNOYANCE_TERMS,
  ...FAKE_NAME_TERMS
];

// Common keyboard row smashing sequences
const KEYBOARD_PATTERNS = [
  "qwerty", "asdfgh", "zxcvbn", "qazwsx", "12345",
  "poiuyt", "lkjhgf", "mnbvcx", "asdfghjkl", "qwertz", "azerty"
];

function normalizeTextForEvasion(text) {
  return text
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[$]/g, "s")
    .replace(/[0]/g, "o")
    .replace(/[1!]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[5]/g, "s")
    .replace(/[*_#+]/g, "") // remove mask chars like f*ck -> fck
    .replace(/[\.\-]/g, ""); // remove dots/dashes like b.a.k.w.a.s -> bakwas
}

function checkBadWording(text) {
  // 1. Direct word check on split words
  const words = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0);

  for (const word of words) {
    if (ALL_BLOCKED_TERMS.includes(word)) {
      if (COMPLAINT_ANNOYANCE_TERMS.includes(word)) {
        return {
          found: true,
          word,
          error: `The word "${word}" expresses negative complaints. For technical assistance or grievances, please use Student Support rather than public reviews.`,
        };
      }
      if (FAKE_NAME_TERMS.includes(word)) {
        return {
          found: true,
          word,
          error: "Please write genuine feedback instead of using placeholder names.",
        };
      }
      return {
        found: true,
        word,
        error: "Please keep your review respectful and constructive. Offensive, defamatory, or disparaging language is not permitted.",
      };
    }
  }

  // 2. Multi-word phrase check
  const lowerText = text.toLowerCase();
  const blockedPhrases = [
    "irritating process", "annoying process", "frustrating process",
    "bad process", "slow process", "waste process", "useless process",
    "very irritating", "very annoying", "very bad", "very slow",
    "waste of time", "hate this", "third class", "developer chor",
    "scam site", "scam website", "fake site", "fake website",
    "full of bugs and useless", "useless app", "useless website",
    "not working", "worst app", "worst website", "worst experience",
    "any name", "fake name", "anonymous name"
  ];
  for (const phrase of blockedPhrases) {
    if (lowerText.includes(phrase)) {
      if (phrase.includes("irritating") || phrase.includes("annoying") || phrase.includes("frustrating") || phrase.includes("process")) {
        return {
          found: true,
          word: phrase,
          error: "Reviews expressing negative process complaints (e.g., 'irritating process') are not permitted. For technical issues, please contact Student Support.",
        };
      }
      return {
        found: true,
        word: phrase,
        error: "Please keep your review respectful and constructive. Defamatory or disparaging remarks are not permitted.",
      };
    }
  }

  // 3. Evasion / obfuscation check (e.g. "b.a.k.w.a.s", "b a k w a s", "b@kwas", "f*ck")
  const normalized = normalizeTextForEvasion(text);

  // Check collapsed single letters: e.g. "b a k w a s" -> "bakwas"
  const collapsedSpacedLetters = text
    .toLowerCase()
    .replace(/([a-z])\s+(?=[a-z](\s+|$))/g, "$1")
    .replace(/[^a-z0-9]/g, "");

  for (const term of ALL_BLOCKED_TERMS) {
    if (term.length >= 4) {
      const termRegex = new RegExp(`\\b${term}\\b`, "i");
      if (termRegex.test(normalized) || normalized.includes(term)) {
        return {
          found: true,
          word: term,
          error: "Please keep your review respectful and constructive. Inappropriate or negative complaint language is not permitted.",
        };
      }
      if (collapsedSpacedLetters.includes(term)) {
        return {
          found: true,
          word: term,
          error: "Please keep your review respectful and constructive. Inappropriate or negative complaint language is not permitted.",
        };
      }
    }
  }

  // Check regex for obfuscated f*ck or sh!t
  if (/\bf[a-z*@!$0-9]{1,2}ck\b/i.test(text) || /\bsh[i!*1]t\b/i.test(text)) {
    return {
      found: true,
      word: "profanity",
      error: "Please keep your review respectful. Inappropriate language is not permitted.",
    };
  }

  return { found: false };
}

// Indian first names commonly used by students / peers
const COMMON_FIRST_NAMES = [
  "rahul", "rohan", "amit", "ankit", "priya", "pooja", "sneha", "aditya",
  "aman", "ayush", "soumya", "subham", "shubham", "debasish", "debashish",
  "satyajit", "pratyush", "vikas", "bikash", "ashish", "asish", "suman",
  "abhishek", "arpit", "vivek", "manish", "kunal", "sameer", "ritik", "ritu",
  "khushbu", "riya", "neha", "anjali", "swati", "payal", "gouri", "archana",
  "deepak", "rakesh", "suresh", "ramesh", "mahesh", "sunil", "anil", "pankaj",
  "sanjay", "tushar", "shakti", "alok", "barsha", "lipsa", "monalisa",
  "chinmay", "biswajit", "jagannath", "jagan", "jyoti", "rajesh", "rinku", "papu",
  "bapi", "vicky", "chandan", "prabhat", "prasant", "prashant", "santosh", "saroj"
];

// Indian surnames commonly used by students
const COMMON_SURNAMES = [
  "sahoo", "sahu", "behera", "nayak", "naik", "jena", "pradhan", "rout", "swain", "das",
  "patra", "mohanty", "pattnaik", "patnaik", "pattanaik", "mishra", "panda", "tripathy",
  "tripathi", "parida", "samal", "biswal", "bhoi", "padhi", "sethi", "sethy",
  "sharma", "verma", "gupta", "singh", "kumar", "patel", "yadav", "roy", "dey",
  "ghosh", "sen", "banerjee", "chatterjee", "reddy", "nair", "rao", "meher",
  "khatua", "dhir", "kunda", "binnala", "dalasingharay", "maharana", "barik", "muduli",
  "lenka", "khandual", "mallick", "malik", "majhi", "basa"
];

// Academic faculty and staff honorifics / titles
const FACULTY_TITLES = [
  "sir", "maam", "ma'am", "madam", "faculty", "prof", "professor",
  "hod", "dean", "principal", "teacher", "teachers"
];

// Common English words to ignore when checking submitter's own name components
const COMMON_ENGLISH_WORDS_EXCLUSIONS = new Set([
  "the", "and", "for", "all", "new", "one", "out", "you", "app", "site",
  "web", "best", "good", "great", "fast", "love", "like", "nice", "team"
]);

function checkNameInComment(comment, studentName = "") {
  const text = (comment || "").toLowerCase();
  const words = text.split(/[^a-z0-9]+/).filter((w) => w.length > 0);

  // 1. Check if the submitting student wrote their own name in the comment
  if (studentName && typeof studentName === "string") {
    const ownParts = studentName
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((p) => p.length >= 3 && !COMMON_ENGLISH_WORDS_EXCLUSIONS.has(p));

    for (const part of ownParts) {
      const wordRegex = new RegExp(`\\b${part}\\b`, "i");
      if (wordRegex.test(text)) {
        return {
          found: true,
          type: "own_name",
          word: part,
          error: "Please do not write your name in the feedback box. Your verified name is already displayed on your review card automatically.",
        };
      }
    }
  }

  // 2. Explicit self-introductions ("my name is...", "mera naam...")
  if (/\b(my name is|mera naam|naam hai)\b/i.test(text)) {
    return {
      found: true,
      type: "intro",
      error: "Please do not include personal names or introductions in your review. Reviews must focus directly on your experience with GradeFlow.",
    };
  }

  // Self-introduction with first name ("i am rahul", "this is rohan", "myself soumya", "i'm ankit")
  const firstNameAlternation = COMMON_FIRST_NAMES.join("|");
  const introNameRegex = new RegExp(
    `\\b(i am|this is|myself|i'm|im)\\s+(${firstNameAlternation})\\b`,
    "i"
  );
  if (introNameRegex.test(text)) {
    return {
      found: true,
      type: "intro_name",
      error: "Please do not include personal names or introductions in your review. Reviews must focus directly on your experience with GradeFlow.",
    };
  }

  // Sign-offs at the end of reviews (e.g. "- by Rahul", "regards Rakesh", "- Rahul")
  const signoffNameRegex = new RegExp(
    `([-~—]\\s*(by\\s+)?|\\b(posted by|written by|regards)\\s*[:\\-]?\\s+)(${firstNameAlternation})\\b`,
    "i"
  );
  if (signoffNameRegex.test(text)) {
    return {
      found: true,
      type: "signoff_name",
      error: "Please do not include personal sign-offs or names in your review. Your verified student profile is automatically linked.",
    };
  }

  // Sign-off structure at end of text: e.g. "- by <word>" or "regards: <word>"
  if (/[-~—]\s*by\s+[a-z]{3,}\s*$/i.test(text) || /\bregards\s*[:\-]\s*[a-z]{3,}\s*$/i.test(text)) {
    return {
      found: true,
      type: "signoff",
      error: "Please do not include personal sign-offs in your review. Your verified student profile is automatically linked.",
    };
  }

  // 3. Faculty / Staff mentions (e.g., "Sharma sir", "our HOD", "physics faculty sir")
  for (const word of words) {
    if (FACULTY_TITLES.includes(word)) {
      return {
        found: true,
        type: "faculty",
        word,
        error: "Please do not mention faculty members, teachers, or staff by title or name in public reviews. Reviews must focus on the GradeFlow platform.",
      };
    }
  }

  // 4. Check for combination of First Name + Surname (e.g., "Rahul Sharma", "Priya Behera", "Debasish Nayak")
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if (
      (COMMON_FIRST_NAMES.includes(w1) && COMMON_SURNAMES.includes(w2)) ||
      (COMMON_SURNAMES.includes(w1) && COMMON_FIRST_NAMES.includes(w2)) ||
      (COMMON_FIRST_NAMES.includes(w1) && COMMON_FIRST_NAMES.includes(w2))
    ) {
      return {
        found: true,
        type: "full_name",
        word: `${w1} ${w2}`,
        error: `Please do not mention personal names ("${w1} ${w2}") in the review box. Reviews must focus solely on your experience with GradeFlow.`,
      };
    }
  }

  // 5. Targeted name check (e.g. "Rohan is...", "Amit bhai...", "Rahul ka score...")
  for (const word of words) {
    if (COMMON_FIRST_NAMES.includes(word)) {
      const targetRegex = new RegExp(
        `\\b(he|she|him|her|his|is|was|ko|ka|ki|ke|bhai|yaar|ne|se)\\s+${word}\\b|\\b${word}\\s+(is|was|ko|ka|ki|ke|bhai|yaar|hai|tha|thi|ne|se)\\b`,
        "i"
      );
      if (targetRegex.test(text)) {
        return {
          found: true,
          type: "targeted_name",
          word,
          error: `Please do not mention personal names ("${word}") in the feedback box. Reviews must focus on the platform.`,
        };
      }
    }
  }

  // 6. Entire review is just names without platform feedback
  const feedbackKeywords = [
    "good", "great", "best", "helpful", "clean", "fast", "speed", "easy",
    "ui", "ux", "website", "app", "portal", "grade", "grades", "sgpa",
    "cgpa", "results", "result", "attendance", "calculator", "feature",
    "platform", "tool", "work", "works", "working", "experience", "love",
    "awesome", "smooth", "simple", "time", "nice", "excellent", "superb",
    "useful", "accurate", "satisfying", "impressed", "service", "daily"
  ];
  const hasFeedbackKeyword = words.some((w) => feedbackKeywords.includes(w));
  if (!hasFeedbackKeyword && words.length <= 4) {
    const nameCount = words.filter(
      (w) => COMMON_FIRST_NAMES.includes(w) || COMMON_SURNAMES.includes(w)
    ).length;
    if (nameCount >= 2) {
      return {
        found: true,
        type: "only_names",
        error: "Please write genuine feedback about GradeFlow rather than personal names.",
      };
    }
  }

  return { found: false };
}

export function validateFeedbackComment(comment, studentName = "") {
  if (!comment || typeof comment !== "string") {
    return { isValid: false, error: "Please write a comment or review." };
  }

  const trimmed = comment.trim();

  // 1. Minimum meaningful length check (at least 4 characters)
  if (trimmed.length < 4) {
    return {
      isValid: false,
      error: "Please write at least 4 characters for your review.",
    };
  }

  // 2. Maximum length check (1000 chars max)
  if (trimmed.length > 1000) {
    return {
      isValid: false,
      error: "Review cannot exceed 1000 characters.",
    };
  }

  // 3. Must contain at least 3 alphabetic letters
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length < 3) {
    return {
      isValid: false,
      error: "Review must contain meaningful text and words.",
    };
  }

  // 4. Minimum 3 words requirement
  const wordsList = trimmed
    .split(/\s+/)
    .map((w) => w.replace(/^[^\w]+|[^\w]+$/g, ""))
    .filter((w) => /[a-zA-Z]/.test(w));

  if (wordsList.length < 3) {
    return {
      isValid: false,
      error: "Please write at least 3 words in your review (e.g., 'Very helpful website').",
    };
  }

  // 5. Check bad wording, profanity, annoyance/complaint terms & evasion
  const badWordResult = checkBadWording(trimmed);
  if (badWordResult.found) {
    return {
      isValid: false,
      error: badWordResult.error,
    };
  }

  // 6. Repeated alphanumeric character spam (e.g. "aaaaa", "ddddd", "jjjjjj")
  if (/([a-zA-Z0-9])\1{3,}/i.test(trimmed)) {
    return {
      isValid: false,
      error: "Review contains too many repeated characters (e.g. 'aaaa'). Please write meaningful feedback.",
    };
  }

  // 7. Check individual words for keyboard smashing, missing vowels, and gibberish
  const words = trimmed
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0);

  for (const word of words) {
    for (const pattern of KEYBOARD_PATTERNS) {
      if (word.includes(pattern)) {
        return {
          isValid: false,
          error: "Review appears to contain random keyboard smashing. Please write genuine feedback.",
        };
      }
    }

    const alphaWord = word.replace(/[^a-z]/g, "");
    if (alphaWord.length >= 4 && !/[aeiouy]/.test(alphaWord)) {
      return {
        isValid: false,
        error: `The word "${word}" appears to be random letters. Please write meaningful feedback.`,
      };
    }

    if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(word)) {
      const isExempt = /lengths|strengths/i.test(word);
      if (!isExempt) {
        return {
          isValid: false,
          error: `The word "${word}" appears to be gibberish. Please write genuine feedback.`,
        };
      }
    }
  }

  // 8. Character diversity (entropy) check for longer texts
  if (lettersOnly.length >= 10) {
    const uniqueChars = new Set(lettersOnly.toLowerCase()).size;
    if (uniqueChars < 3) {
      return {
        isValid: false,
        error: "Review contains too many repetitive patterns. Please write genuine feedback.",
      };
    }
  }

  // 9. Personal names, self-introductions, sign-offs, and faculty mentions check
  const nameCheckResult = checkNameInComment(trimmed, studentName);
  if (nameCheckResult.found) {
    return {
      isValid: false,
      error: nameCheckResult.error,
    };
  }

  return { isValid: true, error: null };
}
