const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 20;

const buckets = new Map();
let sweepCounter = 0;
const SWEEP_EVERY = 500;
const MAX_BUCKETS = 50000;

const normalizeKeyPart = (value) => String(value || '').trim().toLowerCase();

const getRequestIp = (req) => {
    const forwarded = req.headers?.['x-forwarded-for'];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (raw) {
        return String(raw).split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown';
};

const shouldRateLimit = (key, { windowMs = WINDOW_MS, maxAttempts = MAX_ATTEMPTS } = {}) => {
    const now = Date.now();
    const normalizedKey = normalizeKeyPart(key);
    const entry = buckets.get(normalizedKey) || { count: 0, resetAt: now + windowMs };

    sweepCounter += 1;
    if (sweepCounter % SWEEP_EVERY === 0 || buckets.size > MAX_BUCKETS) {
        for (const [bucketKey, bucketValue] of buckets.entries()) {
            if (!bucketValue?.resetAt || now > bucketValue.resetAt) {
                buckets.delete(bucketKey);
            }
        }
    }

    if (now > entry.resetAt) {
        buckets.set(normalizedKey, { count: 1, resetAt: now + windowMs });
        return { limited: false, retryAfterSeconds: 0 };
    }

    entry.count += 1;
    buckets.set(normalizedKey, entry);

    if (entry.count > maxAttempts) {
        const retryAfterSeconds = Math.max(Math.ceil((entry.resetAt - now) / 1000), 1);
        return { limited: true, retryAfterSeconds };
    }

    return { limited: false, retryAfterSeconds: 0 };
};

export { getRequestIp, shouldRateLimit };
