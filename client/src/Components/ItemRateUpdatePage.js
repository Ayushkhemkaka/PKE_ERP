import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const ItemRateUpdatePage = () => {
    const { currentUser, notify, notifyError } = useAppContext();
    const [items, setItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const loadItems = useCallback(async () => {
        try {
            const [itemsResponse] = await Promise.all([
                axios.get('/data/items/catalog', { params: { includeInactive: true } })
            ]);
            setItems(itemsResponse.data.data || []);
        } catch (error) {
            notifyError(error, 'Unable to load item rates.');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const submitHandler = async (event) => {
        event.preventDefault();
        const itemId = event.target.itemId.value;
        const rate = event.target.rate.value;
        const selectedItem = items.find((item) => String(item.id) === String(itemId));
        const measurementUnitId = selectedItem?.defaultMeasurementUnitId || '';

        if (!measurementUnitId) {
            notify('error', 'No default unit is linked to this item.');
            return;
        }

        try {
            const response = await axios.post('/data/item-rates', {
                itemId,
                measurementUnitId,
                rate,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            event.target.reset();
            setSelectedItemId('');
            loadItems();
        } catch (error) {
            notifyError(error, 'Unable to update item rate.');
        }
    };

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Items</span>
                    <h2 className="mb-2">Rates</h2>
                    <p className="page-subtitle mb-0">Update item prices by item and linked measurement unit.</p>
                </div>
                <div className="page-badge">Rates</div>
            </div>
            <div className="section-card">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Update Rate</h5>
                        <p className="section-subtitle mb-0">Every rate change is tracked in item history for analytics.</p>
                    </div>
                </div>
                <form onSubmit={submitHandler}>
                    <div className="row g-3">
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="itemId">Item</label>
                                <select id="itemId" name="itemId" className="form-select app-input" required value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
                                    <option value="">Select item</option>
                                    {items.map((item) => <option key={item.id} value={item.id}>{item.itemName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field app-display-field">
                                <span className="form-label">Unit</span>
                                <div className="app-display-value">
                                    {items.find((item) => String(item.id) === String(selectedItemId))?.defaultMeasurementUnitName || '-'}
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="rate">Rate</label>
                                <input id="rate" name="rate" type="number" step="0.01" min="0" className="form-control app-input" required placeholder="Enter rate" />
                            </div>
                        </div>
                    </div>
                    <div className="action-row mt-4">
                        <button type="submit" className="btn btn-success btn-lg">Save</button>
                    </div>
                </form>
            </div>
            <div className="section-card mt-4">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Current Rates</h5>
                    </div>
                </div>
                {isLoading ? <p className="mb-0">Loading rates...</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Unit</th>
                                <th>Rate</th>
                                <th>Default</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.flatMap((item) => item.measurementUnits.map((unit) => (
                                <tr key={`${item.id}-${unit.measurementUnitId}`}>
                                    <td>{item.itemName}</td>
                                    <td>{unit.measurementUnitName}</td>
                                    <td>{Number(unit.rate || 0).toFixed(2)}</td>
                                    <td>{item.defaultMeasurementUnitId === unit.measurementUnitId ? 'Yes' : 'No'}</td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>}
            </div>
        </section>
    );
};

export default ItemRateUpdatePage;
