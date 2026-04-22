import { query } from "../configs/dbConn.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { logUserWork } from "../utils/workTracking.js";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const BASE_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'Pke@1234';

const sanitizeUser = (user) => ({
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    mustChangePassword: Boolean(user.must_change_password)
});

const signup = async (req, res) => {
    const { fullName, email } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!fullName?.trim() || !normalizedEmail) {
        sendError(res, "Full name and email are required.");
        return;
    }

    try {
        const existingUser = await query('SELECT id FROM app_user WHERE email = ?', [normalizedEmail]);
        if (existingUser.length > 0) {
            sendError(res, "An account with this email already exists.", 409);
            return;
        }

        const result = await query(
            `INSERT INTO app_user(full_name, email, password_hash, must_change_password)
             VALUES (?, ?, NULL, 1)`,
            [fullName.trim(), normalizedEmail]
        );
        const createdUser = await query(
            'SELECT id, full_name, email, must_change_password FROM app_user WHERE id = ?',
            [result.insertId]
        );
        await logUserWork({
            userId: createdUser[0].id,
            userName: createdUser[0].full_name,
            userEmail: createdUser[0].email,
            actionType: 'signup',
            entityType: 'user',
            entityId: String(createdUser[0].id),
            details: { email: createdUser[0].email }
        });
        sendSuccess(res, "Account created successfully. Use the temporary password to log in.", sanitizeUser(createdUser[0]), 201);
    } catch (error) {
        console.error('Signup failed', error);
        sendError(res, "Unable to create account right now.", 500);
    }
}

const login = async (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
        sendError(res, "Email and password are required.");
        return;
    }

    try {
        const result = await query(
            'SELECT id, full_name, email, password_hash, must_change_password FROM app_user WHERE email = ?',
            [normalizedEmail]
        );

        if (result.length === 0) {
            sendError(res, "Invalid email or password.", 401);
            return;
        }

        const user = result[0];
        let isValid = false;
        const hasPasswordHash = Boolean(user.password_hash);

        if (hasPasswordHash) {
            isValid = await verifyPassword(password, user.password_hash);
        } else {
            isValid = password === BASE_PASSWORD;
        }

        if (!isValid) {
            sendError(res, "Invalid email or password.", 401);
            return;
        }

        const mustChangePassword = Boolean(user.must_change_password) || !hasPasswordHash;

        if (!hasPasswordHash) {
            try {
                const baseHash = await hashPassword(BASE_PASSWORD);
                await query(
                    'UPDATE app_user SET password_hash = ?, must_change_password = 1 WHERE id = ?',
                    [baseHash, user.id]
                );
            } catch (error) {
                console.error('Failed to store base password hash', error);
            }
        }

        await logUserWork({
            userId: user.id,
            userName: user.full_name,
            userEmail: user.email,
            actionType: 'login',
            entityType: 'auth',
            entityId: String(user.id),
            details: mustChangePassword ? { mustChangePassword: true } : undefined
        });
        sendSuccess(res, "Login successful.", {
            ...sanitizeUser({ ...user, must_change_password: mustChangePassword }),
            mustChangePassword
        });
    } catch (error) {
        console.error('Login failed', error);
        sendError(res, "Unable to log in right now.", 500);
    }
}

const changePassword = async (req, res) => {
    const { email, currentPassword, newPassword } = req.body || {};
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !currentPassword || !newPassword) {
        sendError(res, "Email, current password, and new password are required.");
        return;
    }

    if (newPassword.length < 8) {
        sendError(res, "New password must be at least 8 characters long.");
        return;
    }

    if (newPassword === BASE_PASSWORD) {
        sendError(res, "New password must be different from the temporary password.");
        return;
    }

    try {
        const result = await query(
            'SELECT id, full_name, email, password_hash, must_change_password FROM app_user WHERE email = ?',
            [normalizedEmail]
        );

        if (result.length === 0) {
            sendError(res, "Invalid email or password.", 401);
            return;
        }

        const user = result[0];
        const hasPasswordHash = Boolean(user.password_hash);
        const isValid = hasPasswordHash
            ? await verifyPassword(currentPassword, user.password_hash)
            : currentPassword === BASE_PASSWORD;

        if (!isValid) {
            sendError(res, "Invalid email or password.", 401);
            return;
        }

        const passwordHash = await hashPassword(newPassword);
        await query(
            'UPDATE app_user SET password_hash = ?, must_change_password = 0 WHERE id = ?',
            [passwordHash, user.id]
        );

        await logUserWork({
            userId: user.id,
            userName: user.full_name,
            userEmail: user.email,
            actionType: 'change_password',
            entityType: 'user',
            entityId: String(user.id)
        });

        sendSuccess(res, "Password updated successfully. Please log in again.", null);
    } catch (error) {
        console.error('Change password failed', error);
        sendError(res, "Unable to update password right now.", 500);
    }
};

export { signup, login, changePassword }
