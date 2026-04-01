import React from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './Components/NavBar.js';
import OrderEntry from './Components/OrderEntry.js';
import B2BOrderEntry from './Components/B2BOrderEntry.js';
import OrderFetch from './Components/OrderFetch.js';
import B2BOrderFetch from './Components/B2BOrderFetch.js';
import RateManager from './Components/RateManager.js';
import Login from './Components/Login.js';
import Signup from './Components/Signup.js'
import User from './Components/User.js';
import AppAlert from './Components/AppAlert.js';
import { AppProvider, useAppContext } from './context/AppContext.js';
import AccountCreate from './Components/AccountCreate.js';
import AccountFetch from './Components/AccountFetch.js';
import AnalyticsPage from './Components/AnalyticsPage.js';
import EmployeeReceiptDesk from './Components/EmployeeReceiptDesk.js';

function AppRoutes() {
  const { currentUser } = useAppContext();

  return (
    <Router>
      <NavBar />
      <main className="app-main">
        <div className="app-container">
          <AppAlert />
          <Routes>
            <Route path='/' element={currentUser ? <User /> : <Navigate to="/login" replace />} />
            <Route path='/login' element={currentUser ? <Navigate to="/" replace /> : <Login />} />
            <Route path='/signup' element={currentUser ? <Navigate to="/" replace /> : <Signup />} />
            <Route path='/orderentry' element={currentUser ? <OrderEntry /> : <Navigate to="/login" replace />} />
            <Route path='/b2borderentry' element={currentUser ? <B2BOrderEntry /> : <Navigate to="/login" replace />} />
            <Route path='/orderfetch' element={currentUser ? <OrderFetch /> : <Navigate to="/login" replace />} />
            <Route path='/b2borderfetch' element={currentUser ? <B2BOrderFetch /> : <Navigate to="/login" replace />} />
            <Route path='/rates' element={currentUser ? <RateManager /> : <Navigate to="/login" replace />} />
            <Route path='/accounts/create' element={currentUser ? <AccountCreate /> : <Navigate to="/login" replace />} />
            <Route path='/accounts/fetch' element={currentUser ? <AccountFetch /> : <Navigate to="/login" replace />} />
            <Route path='/analytics' element={currentUser ? <AnalyticsPage /> : <Navigate to="/login" replace />} />
            <Route path='/employee-receipts' element={currentUser ? <EmployeeReceiptDesk /> : <Navigate to="/login" replace />} />
          </Routes>
        </div>
      </main>
    </Router>
  );
}

function App() {
  return (
    <div className="app-shell">
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </div>
  );
}

export default App;
