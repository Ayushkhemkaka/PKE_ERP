import React, { useState } from 'react'
import { NavLink as Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.js';

const NavBar = () => {
  const { currentUser, logout, notify } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState('');

  const openMenuHandler = (menuKey) => {
    setOpenMenu(menuKey);
  };

  const closeMenuHandler = () => {
    setOpenMenu('');
  };

  const getCashLabel = () => {
    const searchParams = new URLSearchParams(location.search);
    const dueMode = searchParams.get('mode');
    if (location.pathname === '/orderentry') {
      return 'Cash: Entry';
    }
    if (location.pathname === '/orderfetch') {
      return 'Cash: Fetch';
    }
    if (location.pathname === '/cash/due' || (location.pathname === '/due-accounts' && dueMode === 'normal')) {
      return 'Cash: Due';
    }
    if (location.pathname === '/cash/history') {
      return 'Cash: History';
    }
    return 'Cash';
  };

  const getB2BLabel = () => {
    const searchParams = new URLSearchParams(location.search);
    const dueMode = searchParams.get('mode');
    if (location.pathname === '/b2borderentry') {
      return 'B2B: Entry';
    }
    if (location.pathname === '/b2borderfetch') {
      return 'B2B: Fetch';
    }
    if (location.pathname === '/b2b/due' || (location.pathname === '/due-accounts' && dueMode !== 'normal')) {
      return 'B2B: Due';
    }
    if (location.pathname === '/b2b/history') {
      return 'B2B: History';
    }
    return 'B2B';
  };

  const getAccountsLabel = () => {
    if (location.pathname === '/accounts/create') {
      return 'Accounts: Create';
    }
    if (location.pathname === '/accounts/fetch') {
      return 'Accounts: Fetch';
    }
    return 'Accounts';
  };

  const getItemsLabel = () => {
    if (location.pathname === '/items/add' || location.pathname === '/items') {
      return 'Items: Add';
    }
    if (location.pathname === '/items/units') {
      return 'Items: Units';
    }
    if (location.pathname === '/items/rates') {
      return 'Items: Rates';
    }
    if (location.pathname === '/items/status') {
      return 'Items: Status';
    }
    if (location.pathname === '/items/sources') {
      return 'Items: Sources';
    }
    return 'Items';
  };

  const logoutHandler = () => {
    logout();
    notify('success', 'You have been logged out.');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg app-navbar">
      <div className="container-fluid px-4">
        <Link className="navbar-brand app-brand" to="/" style={{ textDecoration: 'none' }}>
          <img src="/parentLogo.png" alt="PK Enterprises" className="app-brand-logo" />
          <div>
            <h2 className="mb-0">P. K. ENTERPRISES</h2>
          </div>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav app-nav-links">
            {currentUser ? <>
              <li className={`nav-item nav-group ${openMenu === 'general' ? 'nav-group-open' : ''}`} onMouseEnter={() => openMenuHandler('general')} onMouseLeave={closeMenuHandler}>
                <button type="button" className="nav-link nav-group-trigger" onFocus={() => openMenuHandler('general')} aria-expanded={openMenu === 'general'}>
                  {getCashLabel()}
                </button>
                {openMenu === 'general' ? <div className="nav-group-menu">
                  <Link className="nav-group-link" to="/orderentry" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Order Entry</Link>
                  <Link className="nav-group-link" to="/orderfetch" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Order Fetch</Link>
                  <Link className="nav-group-link" to="/cash/due" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Due Accounts</Link>
                  <Link className="nav-group-link" to="/cash/history" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Invoice History</Link>
                </div> : null}
              </li>
              <li className={`nav-item nav-group ${openMenu === 'b2b' ? 'nav-group-open' : ''}`} onMouseEnter={() => openMenuHandler('b2b')} onMouseLeave={closeMenuHandler}>
                <button type="button" className="nav-link nav-group-trigger" onFocus={() => openMenuHandler('b2b')} aria-expanded={openMenu === 'b2b'}>
                  {getB2BLabel()}
                </button>
                {openMenu === 'b2b' ? <div className="nav-group-menu">
                  <Link className="nav-group-link" to="/b2borderentry" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Order Entry</Link>
                  <Link className="nav-group-link" to="/b2borderfetch" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Order Fetch</Link>
                  <Link className="nav-group-link" to="/b2b/due" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Due Accounts</Link>
                  <Link className="nav-group-link" to="/b2b/history" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Invoice History</Link>
                </div> : null}
              </li>
              <li className={`nav-item nav-group ${openMenu === 'accounts' ? 'nav-group-open' : ''}`} onMouseEnter={() => openMenuHandler('accounts')} onMouseLeave={closeMenuHandler}>
                <button type="button" className="nav-link nav-group-trigger" onFocus={() => openMenuHandler('accounts')} aria-expanded={openMenu === 'accounts'}>
                  {getAccountsLabel()}
                </button>
                {openMenu === 'accounts' ? <div className="nav-group-menu">
                  <Link className="nav-group-link" to="/accounts/create" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Create Account</Link>
                  <Link className="nav-group-link" to="/accounts/fetch" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Account Fetch</Link>
                </div> : null}
              </li>
              <li className={`nav-item nav-group ${openMenu === 'items' ? 'nav-group-open' : ''}`} onMouseEnter={() => openMenuHandler('items')} onMouseLeave={closeMenuHandler}>
                <button type="button" className="nav-link nav-group-trigger" onFocus={() => openMenuHandler('items')} aria-expanded={openMenu === 'items'}>
                  {getItemsLabel()}
                </button>
                {openMenu === 'items' ? <div className="nav-group-menu">
                  <Link className="nav-group-link" to="/items/add" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Add Item</Link>
                  <Link className="nav-group-link" to="/items/units" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Units</Link>
                  <Link className="nav-group-link" to="/items/rates" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Rates</Link>
                  <Link className="nav-group-link" to="/items/status" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Status</Link>
                  <Link className="nav-group-link" to="/items/sources" style={{ textDecoration: 'none' }} onClick={closeMenuHandler}>Sources</Link>
                </div> : null}
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/onsite-cash" style={{ textDecoration: 'none' }}>Onsite Cash</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/analytics" style={{ textDecoration: 'none' }}>Analytics</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/employee-receipts" style={{ textDecoration: 'none' }}>Receipt Desk</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/owner-reprints" style={{ textDecoration: 'none' }}>Reprint Receipts</Link>
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
