import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext.js";

const Login = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, notify } = useAppContext();
    const navigate = useNavigate();
    const demoCredentials = {
        email: 'test@pke.local',
        password: 'Test@1234'
    };

    const submitHandler = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const email = event.target.email.value;
        const password = event.target.password.value;

        try {
            const response = await axios.post('/auth/login', { email, password });
            login(response.data.data);
            notify('success', response.data.message);
            navigate('/');
        } catch (error) {
            if (email.trim().toLowerCase() === demoCredentials.email && password === demoCredentials.password) {
                login({
                    id: 'demo-user',
                    fullName: 'PKE Test User',
                    email: demoCredentials.email
                });
                notify('success', 'Demo login successful.');
                navigate('/');
                return;
            }
            notify('error', error.response?.data?.message || 'Unable to log in right now.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="auth-layout">
            <div className="auth-intro">
                <span className="page-eyebrow">Welcome</span>
                <h1>Login to continue.</h1>
                <p className="mb-0">Access order entry, item rates, invoice printing, and searchable history from one workspace.</p>
                <div className="auth-feature-list">
                    <div className="auth-feature-card">
                        <span>Orders</span>
                        <strong>Entry + print workflow</strong>
                    </div>
                    <div className="auth-feature-card">
                        <span>Pricing</span>
                        <strong>Manage item-wise rates</strong>
                    </div>
                    <div className="auth-feature-card">
                        <span>Data</span>
                        <strong>Search, export, and import</strong>
                    </div>
                </div>
            </div>
            <form className="auth-form-card" onSubmit={submitHandler}>
                <div className="auth-form-header">
                    <h3 className="mb-1">Login</h3>
                    <p className="mb-0">Use your ERP account or the demo credentials to test the app.</p>
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" className="form-control app-input" required placeholder="you@example.com" />
                </div>
                <div className="app-field mb-3">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input id="password" name="password" type="password" className="form-control app-input" required placeholder="Enter your password" />
                </div>
                <button type="submit" className="btn btn-success btn-lg w-100" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing In...' : 'Login'}
                </button>
                <div className="auth-demo-box">
                    <span>Demo Login</span>
                    <strong>test@pke.local / Test@1234</strong>
                </div>
                <p className="auth-helper-text mb-0">Need an account? <Link to="/signup">Create one</Link></p>
            </form>
        </section>
        )
    }

export default Login;
