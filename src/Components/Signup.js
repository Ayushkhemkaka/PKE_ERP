import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.js";

const Singup = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, notify } = useAppContext();
    const navigate = useNavigate();

    const submitHandler = async (event) => {
        event.preventDefault();
        const fullName = event.target.fullName.value;
        const email = event.target.email.value;
        const password = event.target.password.value;
        const confirmPassword = event.target.confirmPassword.value;

        if (password !== confirmPassword) {
            notify('error', 'Passwords do not match.');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post('http://localhost:8000/auth/signup', { fullName, email, password });
            login(response.data.data);
            notify('success', response.data.message);
            navigate('/');
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to create account right now.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="auth-layout">
            <div className="auth-intro">
                <span className="page-eyebrow">Accounts</span>
                <h1>Create your ERP account.</h1>
                <p className="mb-0">Sign up once and use the same identity for order entry, rate management, and update tracking.</p>
                <div className="auth-feature-list">
                    <div className="auth-feature-card">
                        <span>Security</span>
                        <strong>Password-based login</strong>
                    </div>
                    <div className="auth-feature-card">
                        <span>Audit</span>
                        <strong>User-linked create and update actions</strong>
                    </div>
                    <div className="auth-feature-card">
                        <span>Workflow</span>
                        <strong>Ready for order operations</strong>
                    </div>
                </div>
            </div>
            <form className="auth-form-card" onSubmit={submitHandler}>
                <div className="auth-form-header">
                    <h3 className="mb-1">Sign Up</h3>
                    <p className="mb-0">Create a new account to start using the ERP workspace.</p>
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="fullName">Full Name</label>
                    <input id="fullName" name="fullName" type="text" className="form-control app-input" required placeholder="Your full name" />
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="signupEmail">Email</label>
                    <input id="signupEmail" name="email" type="email" className="form-control app-input" required placeholder="you@example.com" />
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="signupPassword">Password</label>
                    <input id="signupPassword" name="password" type="password" className="form-control app-input" required minLength="8" placeholder="At least 8 characters" />
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                    <input id="confirmPassword" name="confirmPassword" type="password" className="form-control app-input" required minLength="8" placeholder="Retype password" />
                </div>
                <button type="submit" className="btn btn-success btn-lg w-100" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
                <p className="auth-helper-text mb-0">Already registered? <Link to="/login">Login here</Link></p>
            </form>
        </section>
        )
    }

export default Singup;
