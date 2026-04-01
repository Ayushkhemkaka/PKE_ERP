import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const AppContext = createContext(null);
const USER_STORAGE_KEY = 'pke_erp_user';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

const AppProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const timeoutRef = useRef(null);

    const clearSessionTimer = () => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const clearStoredSession = () => {
        window.localStorage.removeItem(USER_STORAGE_KEY);
    };

    const createSessionPayload = (user) => ({
        user,
        lastActivityAt: Date.now()
    });

    const persistSession = (session) => {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session));
    };

    const scheduleSessionTimeout = () => {
        clearSessionTimer();
        timeoutRef.current = window.setTimeout(() => {
            setCurrentUser(null);
            clearStoredSession();
            setNotification({
                type: 'error',
                message: 'Your session expired after 30 minutes of inactivity. Please log in again.'
            });
        }, SESSION_TIMEOUT_MS);
    };

    const markSessionActive = () => {
        if (!currentUser) {
            return;
        }

        persistSession(createSessionPayload(currentUser));
        scheduleSessionTimeout();
    };

    useEffect(() => {
        const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
        if (storedUser) {
            try {
                const parsedSession = JSON.parse(storedUser);
                const lastActivityAt = Number(parsedSession?.lastActivityAt || 0);
                const hasExpired = !parsedSession?.user || !lastActivityAt || (Date.now() - lastActivityAt) > SESSION_TIMEOUT_MS;

                if (hasExpired) {
                    clearStoredSession();
                    setIsAuthReady(true);
                    return;
                }

                setCurrentUser(parsedSession.user);
            } catch (error) {
                clearStoredSession();
            }
        }
        setIsAuthReady(true);
    }, []);

    useEffect(() => {
        if (!currentUser) {
            clearSessionTimer();
            return undefined;
        }

        scheduleSessionTimeout();

        const handleActivity = () => {
            markSessionActive();
        };

        ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, handleActivity, { passive: true });
        });

        return () => {
            clearSessionTimer();
            ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, handleActivity);
            });
        };
    }, [currentUser]);

    const notify = (type, message) => {
        setNotification({ type, message });
    };

    const clearNotification = () => setNotification(null);

    const login = (user) => {
        setCurrentUser(user);
        persistSession(createSessionPayload(user));
        scheduleSessionTimeout();
    };

    const logout = () => {
        setCurrentUser(null);
        clearSessionTimer();
        clearStoredSession();
    };

    const value = useMemo(() => ({
        notification,
        notify,
        clearNotification,
        currentUser,
        isAuthReady,
        login,
        logout
    }), [notification, currentUser, isAuthReady]);

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
