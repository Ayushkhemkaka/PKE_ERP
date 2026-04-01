import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const ItemStatusManager = () => {
    const { currentUser, notify } = useAppContext();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadItems = useCallback(async () => {
        try {
            const response = await axios.get('/data/items/catalog', { params: { includeInactive: true } });
            setItems(response.data.data || []);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load items.');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const statusHandler = async (itemId, isActive) => {
        try {
            const response = await axios.post('/data/items/status', {
                itemId,
                isActive: !isActive,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            loadItems();
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to update item status.');
        }
    };

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Items</span>
                    <h2 className="mb-2">Status</h2>
                    <p className="page-subtitle mb-0">Activate or deactivate items without losing their rate history.</p>
                </div>
                <div className="page-badge">Status</div>
            </div>
            <div className="section-card">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Item Status</h5>
                    </div>
                </div>
                {isLoading ? <p className="mb-0">Loading items...</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Default Unit</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.itemName}</td>
                                    <td>{item.defaultMeasurementUnitName || '-'}</td>
                                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                                    <td>
                                        <button type="button" className={`btn btn-sm ${item.isActive ? 'btn-outline-dark' : 'btn-success'}`} onClick={() => statusHandler(item.id, item.isActive)}>
                                            {item.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            </div>
        </section>
    );
};

export default ItemStatusManager;
