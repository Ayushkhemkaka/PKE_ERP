import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.js";

const ChangePassword = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { currentUser, logout, notify, notifyError } = useAppContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate('/login', { replace: true });
        }
    }, [currentUser, navigate]);

    const submitHandler = async (event) => {
        if (!currentUser) {
            return;
        }

        const currentPassword = event.target.currentPassword.value;
        const newPassword = event.target.newPassword.value;
        const confirmPassword = event.target.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            notify('error', 'Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post('/auth/change-password', {
                email: currentUser.email,
                currentPassword,
                newPassword
            });
            notify('success', response.data.message);
            logout();
            navigate('/login', { replace: true });
        } catch (error) {
            notifyError(error, 'Unable to update password right now.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="auth-layout">
            <div className="auth-intro">
                <span className="page-eyebrow">Security</span>
                <h1>Update your password.</h1>
                <p className="mb-0">To start using the ERP workspace you must change your temporary password, then log in again.</p>
                <div className="auth-feature-list">
                    <div className="auth-feature-card">
                        <span>Step 1</span>
                        <strong>Set a new password</strong>
                    </div>
                    <div className="auth-feature-card">
                        <span>Step 2</span>
                        <strong>Log in again to continue</strong>
                    </div>
                    <div className="auth-feature-card">
                        <span>Tip</span>
                        <strong>Use 8+ characters</strong>
                    </div>
                </div>
            </div>
            <form
                className="auth-form-card"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void submitHandler(event);
                }}
            >
                <div className="auth-form-header">
                    <h3 className="mb-1">Change Password</h3>
                    <p className="mb-0">{currentUser ? `Signed in as ${currentUser.email}` : 'Sign in to continue.'}</p>
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="currentPassword">Current Password</label>
                    <input id="currentPassword" name="currentPassword" type="password" className="form-control app-input" required placeholder="Enter current password" />
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="newPassword">New Password</label>
                    <input id="newPassword" name="newPassword" type="password" className="form-control app-input" required minLength="8" placeholder="At least 8 characters" />
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="confirmNewPassword">Confirm New Password</label>
                    <input id="confirmNewPassword" name="confirmPassword" type="password" className="form-control app-input" required minLength="8" placeholder="Retype new password" />
                </div>
                <button type="submit" className="btn btn-success btn-lg w-100" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
            </form>
        </section>
    );
};

export default ChangePassword;
