import React from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './Components/NavBar.js';
import OrderEntry from './Components/OrderEntry.js';
import B2BOrderEntry from './Components/B2BOrderEntry.js';
import OrderFetch from './Components/OrderFetch.js';
import B2BOrderFetch from './Components/B2BOrderFetch.js';
import RateManager from './Components/RateManager.js';
import MeasurementUnitManager from './Components/MeasurementUnitManager.js';
import ItemRateUpdatePage from './Components/ItemRateUpdatePage.js';
import ItemStatusManager from './Components/ItemStatusManager.js';
import Login from './Components/Login.js';
import Signup from './Components/Signup.js'
import AppAlert from './Components/AppAlert.js';
import { AppProvider, useAppContext } from './context/AppContext.js';
import AccountCreate from './Components/AccountCreate.js';
import AccountFetch from './Components/AccountFetch.js';
import DueAccountsPage from './Components/DueAccountsPage.js';
import AnalyticsPage from './Components/AnalyticsPage.js';
import EmployeeReceiptDesk from './Components/EmployeeReceiptDesk.js';
import OwnerReceiptReprint from './Components/OwnerReceiptReprint.js';
import InvoiceHistoryPage from './Components/InvoiceHistoryPage.js';

const RouteLoader = () => (
  <main className="app-main">
    <div className="app-container">
      <section className="form-container">
        <p className="mb-0">Loading workspace...</p>
      </section>
    </div>
  </main>
);

function AppLayout() {
  const { currentUser, isAuthReady } = useAppContext();
  const location = useLocation();
  const isPublicReceiptDesk = location.pathname === '/receipt-desk';

  if (!isAuthReady) {
    return <RouteLoader />;
  }

  return (
    <>
      {isPublicReceiptDesk ? null : <NavBar />}
      <main className={`app-main${isPublicReceiptDesk ? ' app-main-public' : ''}`}>
        <div className={`app-container${isPublicReceiptDesk ? ' app-container-public' : ''}`}>
          {isPublicReceiptDesk ? null : <AppAlert />}
          <Routes>
            <Route path='/' element={<Navigate to={currentUser ? "/orderentry" : "/login"} replace />} />
            <Route path='/login' element={currentUser ? <Navigate to="/orderentry" replace /> : <Login />} />
            <Route path='/signup' element={currentUser ? <Navigate to="/orderentry" replace /> : <Signup />} />
            <Route path='/orderentry' element={currentUser ? <OrderEntry /> : <Navigate to="/login" replace />} />
            <Route path='/b2borderentry' element={currentUser ? <B2BOrderEntry /> : <Navigate to="/login" replace />} />
            <Route path='/orderfetch' element={currentUser ? <OrderFetch /> : <Navigate to="/login" replace />} />
            <Route path='/b2borderfetch' element={currentUser ? <B2BOrderFetch /> : <Navigate to="/login" replace />} />
            <Route path='/items' element={currentUser ? <RateManager /> : <Navigate to="/login" replace />} />
            <Route path='/items/add' element={currentUser ? <RateManager /> : <Navigate to="/login" replace />} />
            <Route path='/items/units' element={currentUser ? <MeasurementUnitManager /> : <Navigate to="/login" replace />} />
            <Route path='/items/rates' element={currentUser ? <ItemRateUpdatePage /> : <Navigate to="/login" replace />} />
            <Route path='/items/status' element={currentUser ? <ItemStatusManager /> : <Navigate to="/login" replace />} />
            <Route path='/rates' element={<Navigate to="/items/add" replace />} />
            <Route path='/accounts/create' element={currentUser ? <AccountCreate /> : <Navigate to="/login" replace />} />
            <Route path='/accounts/fetch' element={currentUser ? <AccountFetch /> : <Navigate to="/login" replace />} />
            <Route path='/due-accounts' element={currentUser ? <DueAccountsPage /> : <Navigate to="/login" replace />} />
            <Route path='/cash/due' element={currentUser ? <DueAccountsPage fixedMode="normal" /> : <Navigate to="/login" replace />} />
            <Route path='/b2b/due' element={currentUser ? <DueAccountsPage fixedMode="b2b" /> : <Navigate to="/login" replace />} />
            <Route path='/cash/history' element={currentUser ? <InvoiceHistoryPage mode="normal" /> : <Navigate to="/login" replace />} />
            <Route path='/b2b/history' element={currentUser ? <InvoiceHistoryPage mode="b2b" /> : <Navigate to="/login" replace />} />
            <Route path='/analytics' element={currentUser ? <AnalyticsPage /> : <Navigate to="/login" replace />} />
            <Route path='/employee-receipts' element={currentUser ? <EmployeeReceiptDesk /> : <Navigate to="/login" replace />} />
            <Route path='/receipt-desk' element={<EmployeeReceiptDesk publicView={true} />} />
            <Route path='/owner-reprints' element={currentUser ? <OwnerReceiptReprint /> : <Navigate to="/login" replace />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function AppRoutes() {
  return (
    <Router>
      <AppLayout />
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
