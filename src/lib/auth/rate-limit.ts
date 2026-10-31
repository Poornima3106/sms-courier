interface AttemptRecord {
  count: number;
  lockedUntil?: number;
  lastAttempt: number;
}

const attempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function checkLoginRateLimit(key: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record) {
    return { allowed: true };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  // If lockout expired, reset
  if (record.lockedUntil && record.lockedUntil <= now) {
    attempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(key: string): { locked: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = attempts.get(key) || { count: 0, lastAttempt: now };

  record.count += 1;
  record.lastAttempt = now;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    attempts.set(key, record);
    return { locked: true, waitSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  attempts.set(key, record);
  return { locked: false };
}

export function resetLoginAttempts(key: string): void {
  attempts.delete(key);
}
