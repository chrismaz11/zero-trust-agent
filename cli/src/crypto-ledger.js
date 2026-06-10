import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const KEY_DIR = path.join(os.homedir(), '.zta');
const KEY_FILE = path.join(KEY_DIR, 'machine.key');

/**
 * Retrieves or lazily creates a machine-specific secret key for signing logs.
 * Stored securely in the user's OS home folder (~/.zta/machine.key).
 */
function getSigningKey() {
  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }

  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE, 'utf8').trim();
  }

  // Generate a cryptographically secure 256-bit key
  const newKey = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(KEY_FILE, newKey, { encoding: 'utf8', mode: 0o600 }); // restrict read/write to current user
  return newKey;
}

/**
 * Appends a cryptographically chained and signed log entry to the ledger.
 */
export function appendAuditLog(eventData, logFilePath = 'zta-audit.signed.jsonl') {
  try {
    const key = getSigningKey();
    let previousHash = '0'.repeat(64);

    // Read the last line of the existing log file to find the previous hash
    if (fs.existsSync(logFilePath)) {
      const content = fs.readFileSync(logFilePath, 'utf8').trim();
      const lines = content.split('\n').filter(Boolean);
      if (lines.length > 0) {
        try {
          const lastEntry = JSON.parse(lines[lines.length - 1]);
          if (lastEntry.hash) {
            previousHash = lastEntry.hash;
          }
        } catch (e) {
          // If the last line is corrupted, we continue with an error mark
          previousHash = 'corrupted_prev_line_hash';
        }
      }
    }

    const payload = {
      timestamp: new Date().toISOString(),
      ...eventData,
      previous_hash: previousHash
    };

    const payloadStr = JSON.stringify(payload);

    // Generate HMAC signature of the payload
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(payloadStr);
    const signature = hmac.digest('hex');

    // Create unique hash for this log entry (payload + signature)
    const entryHash = crypto.createHash('sha256')
      .update(payloadStr + signature)
      .digest('hex');

    const signedEntry = {
      payload,
      signature,
      hash: entryHash
    };

    fs.appendFileSync(logFilePath, JSON.stringify(signedEntry) + '\n', 'utf8');
  } catch (err) {
    console.error(`[ZTA Ledger Error] Failed to write signed audit log: ${err.message}`);
  }
}

/**
 * Verifies the integrity of the signed and chained ledger log file.
 * Returns { verified: true } or { verified: false, error: 'Reason', line: index }.
 */
export function verifyLedger(logFilePath = 'zta-audit.signed.jsonl') {
  if (!fs.existsSync(logFilePath)) {
    return { verified: false, error: 'Audit file does not exist.' };
  }

  try {
    const key = getSigningKey();
    const content = fs.readFileSync(logFilePath, 'utf8').trim();
    const lines = content.split('\n').filter(Boolean);
    
    let expectedPrevHash = '0'.repeat(64);

    for (let i = 0; i < lines.length; i++) {
      const entry = JSON.parse(lines[i]);
      
      // 1. Check basic structure
      if (!entry.payload || !entry.signature || !entry.hash) {
        return { verified: false, error: 'Malformed log entry structure', line: i + 1 };
      }

      const payloadStr = JSON.stringify(entry.payload);

      // 2. Verify HMAC Signature
      const hmac = crypto.createHmac('sha256', key);
      hmac.update(payloadStr);
      const computedSignature = hmac.digest('hex');
      
      if (computedSignature !== entry.signature) {
        return { verified: false, error: 'HMAC signature verification failed (Log has been modified)', line: i + 1 };
      }

      // 3. Verify Hash Chain Integrity
      if (entry.payload.previous_hash !== expectedPrevHash) {
        return { verified: false, error: 'Hash chain link broken (An entry was inserted or deleted)', line: i + 1 };
      }

      // 4. Verify Computed Hash matches stored hash
      const computedHash = crypto.createHash('sha256')
        .update(payloadStr + entry.signature)
        .digest('hex');

      if (computedHash !== entry.hash) {
        return { verified: false, error: 'Computed hash mismatch', line: i + 1 };
      }

      // Set the expected previous hash for the next line
      expectedPrevHash = entry.hash;
    }

    return { verified: true };
  } catch (err) {
    return { verified: false, error: `Verification crash: ${err.message}` };
  }
}
