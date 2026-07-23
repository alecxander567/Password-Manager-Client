/**
 * Client-side password strength evaluation.
 * Mirrors the backend's algorithm in vaults/utils/password_strength.py
 * for offline/fast client-side scoring.
 *
 * Thresholds (matching Django backend):
 *   < 25  → very_weak
 *   < 50  → weak
 *   < 70  → moderate
 *   < 90  → strong
 *   >= 90 → very_strong
 */

const COMMON_PASSWORDS = new Set([
  "123456", "password", "12345678", "qwerty", "123456789",
  "12345", "1234", "111111", "1234567", "dragon",
  "123123", "baseball", "abc123", "football", "monkey",
  "letmein", "696969", "shadow", "master", "666666",
  "qwertyuiop", "123321", "mustang", "1234567890", "michael",
  "654321", "pussy", "superman", "1qaz2wsx", "7777777",
  "fuckyou", "121212", "000000", "qazwsx", "123qwe",
  "killer", "trustno1", "jordan", "jennifer", "zxcvbnm",
  "asdfgh", "hunter", "buster", "soccer", "harley",
  "batman", "andrew", "tigger", "sunshine", "iloveyou",
  "fuckme", "2000", "charlie", "robert", "thomas",
  "hockey", "ranger", "daniel", "starwars", "klaster",
  "112233", "george", "asshole", "computer", "michelle",
  "jessica", "pepper", "1111", "zxcvbn", "555555",
  "11111111", "131313", "freedom", "777777", "pass",
  "fuck", "maggie", "159753", "aaaaaa", "ginger",
  "princess", "joshua", "cheese", "amanda", "summer",
  "love", "ashley", "6969", "nicole", "chelsea",
  "biteme", "matthew", "access", "yankees", "987654321",
  "dallas", "austin", "thunder", "taylor", "matrix",
  "wilbur", "william", "corvette", "hello", "martin",
  "heather", "secret", "fucker", "merlin", "diamond",
  "steelers", "joseph", "hannibal", "blowme",
  "shitface", "boston", "test123", "fender", "midnight",
  "ass", "qwerty123", "steven", "dick", "butthead",
  "bigdaddy", "12345678910", "victoria", "asdf", "999999",
  "aaaaaaaa", "abcd1234", "1q2w3e4r", "fuckyou123", "admin",
  "lovely", "flower", "samantha", "andrea", "butterfly",
  "success", "death", "slayer", "hello123", "boomer",
  "james", "0987654321", "hotdog", "mother", "nature",
  "shit", "zxcvbnm123", "123456789a", "zaq12wsx", "qwe123",
  "111", "brandon", "international", "password1", "nothing",
  "banana", "loveme", "killer123", "098765", "1q2w3e",
  "trust", "chocolate", "liverpool", "cheese123", "london",
  "cowboy", "password123", "123456789q", "qwerty12345", "password12345",
  "test", "guest", "123", "qwerty1", "changeme",
  "temp", "temp123", "pass123", "passw0rd", "p@ssword",
  "P@ssw0rd", "Passw0rd", "Pass1234", "default", "welcome",
  "letmein123", "welcome1", "passwd", "pwd", "iloveu",
  "1212", "2020", "2021", "2022", "2023",
  "2024", "2025", "2026", "admin123", "root",
  "toor", "qwerty123456", "asdfgh123", "zxcvbn123", "1qaz2wsx3edc",
]);

const LOWERCASE_RE = /[a-z]/;
const UPPERCASE_RE = /[A-Z]/;
const DIGIT_RE = /[0-9]/;
const SPECIAL_RE = /[^a-zA-Z0-9\s]/;
const SEQUENCE_RE = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210|qaz|wsx|edc|rfv|tgb|yhn|ujm|ik,|ol.|zaq|xsw|cde|vfr|bgt|nhy|mju|,ki|.lo)/i;
const REPEATED_RE = /(.)\1{2,}/;
const KEYBOARD_PATTERNS = ["qwerty", "asdfgh", "zxcvbn", "qwertz", "azerty", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

export const STRENGTH_THRESHOLDS = [
  { max: 24, label: "very_weak" },
  { max: 49, label: "weak" },
  { max: 69, label: "moderate" },
  { max: 89, label: "strong" },
  { max: 100, label: "very_strong" },
];

export const STRENGTH_COLORS = {
  very_weak: "bg-red-500",
  weak: "bg-orange-500",
  moderate: "bg-yellow-500",
  strong: "bg-green-500",
  very_strong: "bg-emerald-600",
};

export const strengthLabel = (label) =>
  (label || "very_weak").replace("_", " ");

function estimateEntropy(password) {
  if (!password) return 0;
  let charSetsSize = 0;
  if (LOWERCASE_RE.test(password)) charSetsSize += 26;
  if (UPPERCASE_RE.test(password)) charSetsSize += 26;
  if (DIGIT_RE.test(password)) charSetsSize += 10;
  if (SPECIAL_RE.test(password)) charSetsSize += 32;
  if (charSetsSize === 0) return 0;
  return password.length * Math.log2(charSetsSize);
}

/**
 * Evaluate password strength client-side.
 * Mirrors the Django backend's check_password_strength().
 */
export function evaluatePasswordStrength(password = "") {
  const value = String(password);
  const feedback = [];

  if (!value) {
    return { score: 0, strength: "very_weak", feedback: [], entropy: 0 };
  }

  // 1. Common password check
  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    return {
      score: 20,
      strength: "very_weak",
      feedback: ["This password is too common and easily guessable."],
      entropy: estimateEntropy(value),
    };
  }

  let score = 0;

  // 2. Length scoring (up to 35 points)
  const length = value.length;
  if (length < 6) {
    score += length * 2;
    feedback.push("Password is too short. Use at least 8 characters.");
  } else if (length < 8) {
    score += 10;
    feedback.push("Consider using at least 12 characters for better security.");
  } else if (length < 10) {
    score += 18;
  } else if (length < 12) {
    score += 22;
  } else if (length < 14) {
    score += 26;
  } else if (length < 16) {
    score += 30;
    feedback.push("Good length.");
  } else {
    score += 35;
    feedback.push("Excellent length.");
  }

  // 3. Character variety (up to 35 points)
  let varietyScore = 0;
  const charTypes = [];
  if (LOWERCASE_RE.test(value)) { varietyScore += 7; charTypes.push("lowercase"); }
  if (UPPERCASE_RE.test(value)) { varietyScore += 9; charTypes.push("uppercase"); }
  if (DIGIT_RE.test(value)) { varietyScore += 8; charTypes.push("digits"); }
  if (SPECIAL_RE.test(value)) { varietyScore += 11; charTypes.push("special"); }
  score += varietyScore;
  if (charTypes.length < 3) {
    feedback.push("Use a mix of uppercase, lowercase, digits, and special characters.");
  }

  // 4. Pattern penalties
  // 4a. Sequences (up to -15)
  const sequences = value.match(SEQUENCE_RE);
  if (sequences) {
    const penalty = Math.min(sequences.length * 5, 15);
    score -= penalty;
    if (penalty > 5) feedback.push("Avoid sequential characters like 'abc' or '123'.");
  }

  // 4b. Repeated chars (up to -10)
  const repeats = value.match(REPEATED_RE);
  if (repeats) {
    const penalty = Math.min(repeats.length * 5, 10);
    score -= penalty;
    if (penalty > 5) feedback.push("Avoid repeated characters like 'aaa'.");
  }

  // 4c. Keyboard patterns (-10)
  for (const pattern of KEYBOARD_PATTERNS) {
    if (value.toLowerCase().includes(pattern)) {
      score -= 10;
      feedback.push("Avoid keyboard sequences like 'qwerty'.");
      break;
    }
  }

  // 5. Entropy bonus (up to 15 points)
  const entropy = estimateEntropy(value);
  if (entropy >= 100) score += 15;
  else if (entropy >= 80) score += 10;
  else if (entropy >= 60) score += 5;
  else if (entropy >= 40) score += 2;

  // Clamp to 0-100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const strength =
    STRENGTH_THRESHOLDS.find((level) => normalizedScore <= level.max)?.label ||
    "very_strong";

  return { score: normalizedScore, strength, feedback, entropy: Math.round(entropy * 100) / 100 };
}