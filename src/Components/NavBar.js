import React from 'react'
import { NavLink as Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.js';

const NavBar = () => {
  const { currentUser, logout, notify } = useAppContext();
  const navigate = useNavigate();

  const logoutHandler = () => {
    logout();
    notify('success', 'You have been logged out.');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg app-navbar">
      <div className="container-fluid px-4">
        <Link className="navbar-brand app-brand" to="/" style={{ textDecoration: 'none' }}>
          <span className="app-brand-mark">PKE</span>
          <div>
            <h4 className="mb-0">P. K. ENTERPRISES</h4>
            <small>Order management workspace</small>
          </div>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav app-nav-links">
            {currentUser ? <>
              <li className="nav-item">
                <Link className="nav-link" to="/" style={{ textDecoration: 'none' }}>Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/orderentry" style={{ textDecoration: 'none' }}>Order Entry</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/b2borderentry" style={{ textDecoration: 'none' }}>B2B Order</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/orderfetch" style={{ textDecoration: 'none' }}>Order Fetch</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/b2borderfetch" style={{ textDecoration: 'none' }}>B2B Fetch</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/rates" style={{ textDecoration: 'none' }}>Rates</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/accounts/create" style={{ textDecoration: 'none' }}>Create Account</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/accounts/fetch" style={{ textDecoration: 'none' }}>Account Fetch</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/analytics" style={{ textDecoration: 'none' }}>Analytics</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/employee-receipts" style={{ textDecoration: 'none' }}>Receipt Desk</Link>
              </li>
              <li className="nav-item nav-user-chip">
                <span className="nav-link">{currentUser.fullName}</span>
              </li>
              <li className="nav-item">
                <button type="button" className="btn btn-outline-dark" onClick={logoutHandler}>Logout</button>
              </li>
            </> : <>
              <li className="nav-item">
                <Link className="nav-link" to="/login" style={{ textDecoration: 'none' }}>Login</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/signup" style={{ textDecoration: 'none' }}>Sign Up</Link>
              </li>
            </>}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default NavBar;
