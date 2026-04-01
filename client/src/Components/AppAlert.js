import React from 'react';
import { useAppContext } from '../context/AppContext.js';

const AppAlert = () => {
    const { notification, clearNotification } = useAppContext();

    if (!notification) {
        return null;
    }

    return (
        <div className={`app-alert app-alert-${notification.type}`}>
            <div>
                <strong>{notification.type === 'success' ? 'Success' : 'Notice'}</strong>
                <p className="mb-0">{notification.message}</p>
            </div>
            <button type="button" className="btn-close" aria-label="Close" onClick={clearNotification}></button>
        </div>
    );
}

export default AppAlert;
