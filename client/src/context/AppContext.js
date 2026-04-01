import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);
const USER_STORAGE_KEY = 'pke_erp_user';

const AppProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (error) {
                window.localStorage.removeItem(USER_STORAGE_KEY);
            }
        }
    }, []);

    const notify = (type, message) => {
        setNotification({ type, message });
    };

    const clearNotification = () => setNotification(null);

    const login = (user) => {
        setCurrentUser(user);
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    };

    const logout = () => {
        setCurrentUser(null);
        window.localStorage.removeItem(USER_STORAGE_KEY);
    };

    const value = useMemo(() => ({
        notification,
        notify,
        clearNotification,
        currentUser,
        login,
        logout
    }), [notification, currentUser]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used inside AppProvider');
    }
    return context;
}

export { AppProvider, useAppContext }
