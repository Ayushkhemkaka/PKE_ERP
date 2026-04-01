import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext.js";

const User = () =>{
    const { currentUser } = useAppContext();
    return(
        <section className="hero-card">
            <div className="hero-copy">
                <span className="page-eyebrow">User</span>
                <h1>{currentUser?.fullName || 'ERP Dashboard'}</h1>
                <p className="mb-0">You are signed in and ready to create orders, search historical records, and print invoice views from the updated workflow.</p>
            </div>
            <div className="hero-panel">
                <div className="hero-stat">
                    <span>Signed In As</span>
                    <strong>{currentUser?.email}</strong>
                </div>
                <div className="hero-stat">
                    <span>Primary Action</span>
                    <strong><Link to="/orderentry" className="dashboard-link">Open Order Entry</Link></strong>
                </div>
                <div className="hero-stat">
                    <span>B2B Workflow</span>
                    <strong><Link to="/b2borderentry" className="dashboard-link">Open B2B Order Entry</Link></strong>
                </div>
                <div className="hero-stat">
                    <span>Reporting</span>
                    <strong><Link to="/analytics" className="dashboard-link">Open Analytics</Link></strong>
                </div>
            </div>
        </section>
    )           
}

export default User;
