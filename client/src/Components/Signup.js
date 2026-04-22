import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.js";

const Singup = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { notify, notifyError } = useAppContext();
    const navigate = useNavigate();

    const submitHandler = async (event) => {
        const fullName = event.target.fullName.value;
        const email = event.target.email.value;

        setIsSubmitting(true);
        try {
            const response = await axios.post('/auth/signup', { fullName, email });
            notify('success', `${response.data.message} Temporary password: Pke@1234`);
            navigate('/login');
        } catch (error) {
            notifyError(error, 'Unable to create account right now.');
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
            <form
                className="auth-form-card"
                onSubmit={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void submitHandler(event);
                }}
            >
                <div className="auth-form-header">
                    <h3 className="mb-1">Sign Up</h3>
                    <p className="mb-0">A temporary password is set for you. You will change it after your first login.</p>
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="fullName">Full Name</label>
                    <input id="fullName" name="fullName" type="text" className="form-control app-input" required placeholder="Your full name" />
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="signupEmail">Email</label>
                    <input id="signupEmail" name="email" type="email" className="form-control app-input" required placeholder="you@example.com" />
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
