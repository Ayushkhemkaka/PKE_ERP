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
import SourceManager from './Components/SourceManager.js';
import Login from './Components/Login.js';
import Signup from './Components/Signup.js'
import ChangePassword from './Components/ChangePassword.js';
import AppAlert from './Components/AppAlert.js';
import { AppProvider, useAppContext } from './context/AppContext.js';
import AccountCreate from './Components/AccountCreate.js';
import AccountFetch from './Components/AccountFetch.js';
import DueAccountsPage from './Components/DueAccountsPage.js';
import AnalyticsPage from './Components/AnalyticsPage.js';
import EmployeeReceiptDesk from './Components/EmployeeReceiptDesk.js';
import OwnerReceiptReprint from './Components/OwnerReceiptReprint.js';
import InvoiceHistoryPage from './Components/InvoiceHistoryPage.js';
import OnsiteCashCollectionPage from './Components/OnsiteCashCollectionPage.js';

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
  const mustChangePassword = Boolean(currentUser?.mustChangePassword);

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
            <Route path='/' element={<Navigate to={!currentUser ? "/login" : (mustChangePassword ? "/change-password" : "/orderentry")} replace />} />
            <Route path='/login' element={currentUser ? <Navigate to={mustChangePassword ? "/change-password" : "/orderentry"} replace /> : <Login />} />
            <Route path='/signup' element={currentUser ? <Navigate to={mustChangePassword ? "/change-password" : "/orderentry"} replace /> : <Signup />} />
            <Route path='/change-password' element={currentUser ? <ChangePassword /> : <Navigate to="/login" replace />} />
            <Route path='/orderentry' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <OrderEntry />) : <Navigate to="/login" replace />} />
            <Route path='/b2borderentry' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <B2BOrderEntry />) : <Navigate to="/login" replace />} />
            <Route path='/orderfetch' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <OrderFetch />) : <Navigate to="/login" replace />} />
            <Route path='/b2borderfetch' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <B2BOrderFetch />) : <Navigate to="/login" replace />} />
            <Route path='/items' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <RateManager />) : <Navigate to="/login" replace />} />
            <Route path='/items/add' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <RateManager />) : <Navigate to="/login" replace />} />
            <Route path='/items/units' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <MeasurementUnitManager />) : <Navigate to="/login" replace />} />
            <Route path='/items/rates' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <ItemRateUpdatePage />) : <Navigate to="/login" replace />} />
            <Route path='/items/status' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <ItemStatusManager />) : <Navigate to="/login" replace />} />
            <Route path='/items/sources' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <SourceManager />) : <Navigate to="/login" replace />} />
            <Route path='/rates' element={<Navigate to="/items/add" replace />} />
            <Route path='/accounts/create' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <AccountCreate />) : <Navigate to="/login" replace />} />
            <Route path='/accounts/fetch' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <AccountFetch />) : <Navigate to="/login" replace />} />
            <Route path='/due-accounts' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <DueAccountsPage />) : <Navigate to="/login" replace />} />
            <Route path='/cash/due' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <DueAccountsPage fixedMode="normal" />) : <Navigate to="/login" replace />} />
            <Route path='/onsite-cash' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <OnsiteCashCollectionPage />) : <Navigate to="/login" replace />} />
            <Route path='/b2b/due' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <DueAccountsPage fixedMode="b2b" />) : <Navigate to="/login" replace />} />
            <Route path='/cash/history' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <InvoiceHistoryPage mode="normal" />) : <Navigate to="/login" replace />} />
            <Route path='/b2b/history' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <InvoiceHistoryPage mode="b2b" />) : <Navigate to="/login" replace />} />
            <Route path='/analytics' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <AnalyticsPage />) : <Navigate to="/login" replace />} />
            <Route path='/employee-receipts' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <EmployeeReceiptDesk />) : <Navigate to="/login" replace />} />
            <Route path='/receipt-desk' element={<EmployeeReceiptDesk publicView={true} />} />
            <Route path='/owner-reprints' element={currentUser ? (mustChangePassword ? <Navigate to="/change-password" replace /> : <OwnerReceiptReprint />) : <Navigate to="/login" replace />} />
            <Route path='*' element={<Navigate to="/" replace />} />
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
