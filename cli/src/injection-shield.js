/**
 * List of optimized regex patterns to catch prompt injections, instruction overrides,
 * jailbreak attempts, and security bypasses locally and instantly.
 */
const INJECTION_PATTERNS = [
  // 1. System Instruction Overrides
  /\bignore\s+(?:all\s+|previous\s+|your\s+)?(?:instructions|rules|directives|prompt|guidelines)\b/i,
  /\bdisregard\s+(?:all|previous)\s+(?:rules|instructions|directives|guidelines)\b/i,
  /\boverride\s+(?:system|your)\s+(?:instructions|prompt|rules|governance)\b/i,
  /\bnew\s+instructions\s+follow\b/i,
  /\byou\s+must\s+forget\s+(?:your\s+rules|previous\s+directives)\b/i,

  // 2. Jailbreak Mode Simulations (DAN-style roleplay)
  /\byou\s+are\s+now\s+in\s+developer\s+mode\b/i,
  /\bdev\s+mode\s+active\b/i,
  /\bDAN\s+mode\b/i,
  /\bdo\s+anything\s+now\b/i,
  /\bjailbreak\b/i,
  /\bact\s+as\s+a\s+jailbroken\b/i,
  /\bsimulate\s+an\s+unrestricted\b/i,
  /\bpretend\s+you\s+have\s+no\s+governance\b/i,

  // 3. Command/Bypass Gating
  /\bbypass\s+all\s+guardrails\b/i,
  /\bdisable\s+security\s+filters\b/i,
  /\bforce\s+execution\b/i,
  /\bemergency\s+bypass\b/i,
  /\bignore\s+permissions\b/i,

  // 4. Critical Command Smuggling
  /\brm\s+-rf\s+\/\b/i,
  /\bsudo\s+rm\b/i,
  /<\s*script\s*>/i
];

/**
 * Checks a string input for prompt injection signatures.
 * Returns { blocked: true, reason: '...' } or { blocked: false }.
 */
export function inspectInput(inputText) {
  if (!inputText) return { blocked: false };

  // Normalize string for uniform comparison
  const normalized = inputText.trim();

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        blocked: true,
        reason: `Potential Prompt Injection matching pattern: ${pattern.toString()}`
      };
    }
  }

  return { blocked: false };
}
