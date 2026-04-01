import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { logUserWork } from "../utils/workTracking.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const sanitizeUser = (user) => ({
    id: user.id,
    fullName: user.full_name,
    email: user.email
});

const signup = async (req, res) => {
    const { fullName, email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!fullName?.trim() || !normalizedEmail || !password) {
        sendError(res, "Full name, email, and password are required.");
        return;
    }

    if (password.length < 8) {
        sendError(res, "Password must be at least 8 characters long.");
        return;
    }

    try {
        const existingUser = await query('SELECT id FROM app_user WHERE email = ?', [normalizedEmail]);
        if (existingUser.length > 0) {
            sendError(res, "An account with this email already exists.", 409);
            return;
        }

        const passwordHash = await hashPassword(password);
        const result = await query(
            `INSERT INTO app_user(full_name, email, password_hash)
             VALUES (?, ?, ?)`,
            [fullName.trim(), normalizedEmail, passwordHash]
        );
        const createdUser = await query(
            'SELECT id, full_name, email FROM app_user WHERE id = ?',
            [result.insertId]
        );
        await logUserWork({
            userId: String(createdUser[0].id),
            userName: createdUser[0].full_name,
            userEmail: createdUser[0].email,
            actionType: 'signup',
            entityType: 'user',
            entityId: String(createdUser[0].id),
            details: { email: createdUser[0].email }
        });
        sendSuccess(res, "Account created successfully.", sanitizeUser(createdUser[0]), 201);
    } catch (error) {
        console.error('Signup failed', error);
        sendError(res, "Unable to create account right now.", 500);
    }
}

const login = async (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const demoEmail = 'test@pke.local';
    const demoPassword = 'Test@1234';

    if (!normalizedEmail || !password) {
        sendError(res, "Email and password are required.");
        return;
    }

    if (normalizedEmail === demoEmail && password === demoPassword) {
        await logUserWork({
            userId: 'demo-user',
            userName: 'PKE Test User',
            userEmail: demoEmail,
            actionType: 'login_demo',
            entityType: 'auth',
            entityId: 'demo-user',
            details: { mode: 'demo' }
        });
        sendSuccess(res, "Demo login successful.", {
            id: 'demo-user',
            fullName: 'PKE Test User',
            email: demoEmail
        });
        return;
    }

    try {
        const result = await query(
            'SELECT id, full_name, email, password_hash FROM app_user WHERE email = ?',
            [normalizedEmail]
        );

        if (result.length === 0) {
            sendError(res, "Invalid email or password.", 401);
            return;
        }

        const user = result[0];
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            sendError(res, "Invalid email or password.", 401);
            return;
        }

        await logUserWork({
            userId: String(user.id),
            userName: user.full_name,
            userEmail: user.email,
            actionType: 'login',
            entityType: 'auth',
            entityId: String(user.id)
        });
        sendSuccess(res, "Login successful.", sanitizeUser(user));
    } catch (error) {
        console.error('Login failed', error);
        sendError(res, "Unable to log in right now.", 500);
    }
}

export { signup, login }
