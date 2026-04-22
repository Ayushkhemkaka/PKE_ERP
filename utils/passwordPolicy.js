const DEFAULT_MIN_LENGTH = 8;

const hasLower = (value) => /[a-z]/.test(value);
const hasUpper = (value) => /[A-Z]/.test(value);
const hasDigit = (value) => /\d/.test(value);
const hasSpecial = (value) => /[^A-Za-z0-9]/.test(value);

const normalize = (value) => String(value || '').trim();

const validatePasswordStrength = (password, { email } = {}) => {
    const candidate = normalize(password);

    if (candidate.length < DEFAULT_MIN_LENGTH) {
        return { ok: false, message: `Password must be at least ${DEFAULT_MIN_LENGTH} characters long.` };
    }

    if (!hasLower(candidate) || !hasUpper(candidate) || !hasDigit(candidate) || !hasSpecial(candidate)) {
        return { ok: false, message: 'Password must include uppercase, lowercase, a number, and a special character.' };
    }

    const normalizedEmail = normalize(email).toLowerCase();
    if (normalizedEmail) {
        const localPart = normalizedEmail.split('@')[0];
        const lowerCandidate = candidate.toLowerCase();
        if (localPart && localPart.length >= 3 && lowerCandidate.includes(localPart)) {
            return { ok: false, message: 'Password should not contain your email username.' };
        }
        if (lowerCandidate.includes(normalizedEmail)) {
            return { ok: false, message: 'Password should not contain your email address.' };
        }
    }

    return { ok: true, message: null };
};

export { validatePasswordStrength };

