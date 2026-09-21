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

export function validateFeedbackComment(comment) {
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

  return { isValid: true, error: null };
}
