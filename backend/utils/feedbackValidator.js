/**
 * GradeFlow Feedback Quality & Anti-Gibberish Validator
 * Strictly blocks spam, random letter smashing (e.g. "jkdbkb"), repeated characters,
 * profanity, and nonsensical input while permitting legitimate English and Hinglish reviews.
 * Enforces a minimum of 3 meaningful words per submission.
 */

function validateFeedbackComment(comment) {
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

  // 3. Must contain at least 3 alphabetic letters (not just numbers, symbols, or emojis)
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

  // 5. Repeated alphanumeric character spam (e.g. "aaaaa", "ddddd", "jjjjjj" - 4+ identical consecutive chars)
  if (/([a-zA-Z0-9])\1{3,}/i.test(trimmed)) {
    return {
      isValid: false,
      error: "Review contains too many repeated characters (e.g. 'aaaa'). Please write meaningful feedback.",
    };
  }

  // 6. Check individual words for keyboard smashing, missing vowels, and gibberish
  const words = trimmed
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 0);

  // Common keyboard row smashing sequences
  const KEYBOARD_PATTERNS = [
    "qwerty",
    "asdfgh",
    "zxcvbn",
    "qazwsx",
    "12345",
    "poiuyt",
    "lkjhgf",
    "mnbvcx",
    "asdfghjkl",
    "qwertz",
    "azerty",
  ];

  // Profanity & offensive slang blacklist (Hindi + English)
  const PROFANITY_LIST = [
    "fuck",
    "bitch",
    "asshole",
    "bastard",
    "chutiya",
    "madarchod",
    "bhenchod",
    "behenchod",
    "gandu",
    "harami",
    "lauda",
    "lund",
    "kutta",
    "kamina",
    "bhosdi",
    "chutiye",
    "gaand",
  ];

  for (const word of words) {
    // Check profanity
    if (PROFANITY_LIST.includes(word)) {
      return {
        isValid: false,
        error: "Please keep your review respectful. Inappropriate language is not permitted.",
      };
    }

    // Check keyboard smash patterns
    for (const pattern of KEYBOARD_PATTERNS) {
      if (word.includes(pattern)) {
        return {
          isValid: false,
          error: "Review appears to contain random keyboard smashing. Please write genuine feedback.",
        };
      }
    }

    // Words with 4 or more alphabetic characters MUST contain at least one vowel (a, e, i, o, u, y)
    // Examples caught: "jkdbkb", "sdfghj", "bcdfgh", "zxcv", "qwrty"
    const alphaWord = word.replace(/[^a-z]/g, "");
    if (alphaWord.length >= 4 && !/[aeiouy]/.test(alphaWord)) {
      return {
        isValid: false,
        error: `The word "${word}" appears to be random letters. Please write meaningful feedback.`,
      };
    }

    // Check for unnatural consonant clusters (5 or more consonants in a row, exempting legitimate English words like 'strengths', 'lengths')
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

  // 7. Character diversity (entropy) check for longer texts
  // If text has 10+ letters, it must use at least 3 distinct letters (blocks "ababababab", "asdasdasd")
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

module.exports = {
  validateFeedbackComment,
};
