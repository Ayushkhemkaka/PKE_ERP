import crypto from 'crypto';

const TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET;
const DEFAULT_TTL_SECONDS = 12 * 60 * 60; // 12 hours

const ensureSecret = () => {
    if (!TOKEN_SECRET) {
        throw new Error('AUTH_TOKEN_SECRET is not set.');
    }
};

const base64UrlEncode = (input) => Buffer.from(input).toString('base64url');
const base64UrlDecodeJson = (input) => JSON.parse(Buffer.from(input, 'base64url').toString('utf8'));

const hmacSha256 = (value) => crypto.createHmac('sha256', TOKEN_SECRET).update(value).digest('base64url');

const timingSafeEqualString = (left, right) => {
    const leftBuffer = Buffer.from(String(left || ''), 'utf8');
    const rightBuffer = Buffer.from(String(right || ''), 'utf8');
    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const createAuthToken = (payload, { ttlSeconds = DEFAULT_TTL_SECONDS } = {}) => {
    ensureSecret();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const body = {
        ...payload,
        iat: nowSeconds,
        exp: nowSeconds + Number(ttlSeconds || DEFAULT_TTL_SECONDS)
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedBody = base64UrlEncode(JSON.stringify(body));
    const signingInput = `${encodedHeader}.${encodedBody}`;
    const signature = hmacSha256(signingInput);
    return `${signingInput}.${signature}`;
};

const verifyAuthToken = (token) => {
    ensureSecret();
    const raw = String(token || '').trim();
    const parts = raw.split('.');
    if (parts.length !== 3) {
        return { ok: false, payload: null, reason: 'invalid_format' };
    }

    const [encodedHeader, encodedBody, signature] = parts;
    const signingInput = `${encodedHeader}.${encodedBody}`;
    const expectedSignature = hmacSha256(signingInput);

    if (!timingSafeEqualString(signature, expectedSignature)) {
        return { ok: false, payload: null, reason: 'invalid_signature' };
    }

    let header;
    let payload;
    try {
        header = base64UrlDecodeJson(encodedHeader);
        payload = base64UrlDecodeJson(encodedBody);
    } catch {
        return { ok: false, payload: null, reason: 'invalid_json' };
    }

    if (header?.alg !== 'HS256' || header?.typ !== 'JWT') {
        return { ok: false, payload: null, reason: 'unsupported_header' };
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (!payload?.exp || Number(payload.exp) <= nowSeconds) {
        return { ok: false, payload: null, reason: 'expired' };
    }

    return { ok: true, payload, reason: null };
};

export { createAuthToken, verifyAuthToken };

