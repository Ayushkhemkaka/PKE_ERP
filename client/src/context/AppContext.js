import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { getErrorMessage } from '../utils/errorUtils.js';

const AppContext = createContext(null);
const USER_STORAGE_KEY = 'pke_erp_user';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

const AppProvider = ({ children }) => {
    const [notification, setNotification] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
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

    const createSessionPayload = (user, token) => ({
        user,
        token,
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

        persistSession(createSessionPayload(currentUser, authToken));
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
                setAuthToken(parsedSession.token || null);
            } catch (error) {
                clearStoredSession();
            }
        }
        setIsAuthReady(true);
    }, []);

    useEffect(() => {
        if (authToken) {
            axios.defaults.headers.common.Authorization = `Bearer ${authToken}`;
        } else {
            delete axios.defaults.headers.common.Authorization;
        }
    }, [authToken]);

    useEffect(() => {
        const interceptorId = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                const status = error?.response?.status;
                const url = String(error?.config?.url || '');
                if (status === 401 && !url.includes('/auth/login')) {
                    setCurrentUser(null);
                    setAuthToken(null);
                    clearSessionTimer();
                    clearStoredSession();
                    setNotification({
                        type: 'error',
                        message: 'Your session expired. Please log in again.'
                    });
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptorId);
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

    const notifyError = (error, fallbackMessage) => {
        setNotification({ type: 'error', message: getErrorMessage(error, fallbackMessage) });
    };

    const clearNotification = () => setNotification(null);

    const login = (payload) => {
        const nextUser = payload?.user ? payload.user : payload;
        const nextToken = payload?.token ?? null;
        setCurrentUser(nextUser);
        setAuthToken(nextToken);
        persistSession(createSessionPayload(nextUser, nextToken));
        scheduleSessionTimeout();
    };

    const logout = () => {
        setCurrentUser(null);
        setAuthToken(null);
        clearSessionTimer();
        clearStoredSession();
    };

    const value = useMemo(() => ({
        notification,
        notify,
        notifyError,
        clearNotification,
        currentUser,
        authToken,
        isAuthReady,
        login,
        logout
    }), [notification, currentUser, authToken, isAuthReady]);

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
