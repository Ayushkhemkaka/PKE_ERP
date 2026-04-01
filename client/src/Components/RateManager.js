import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const RateManager = () => {
    const { currentUser, notify } = useAppContext();
    const [items, setItems] = useState([]);
    const [measurementUnits, setMeasurementUnits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [itemsResponse, unitsResponse] = await Promise.all([
                axios.get('/data/items/catalog', { params: { includeInactive: true } }),
                axios.get('/data/measurement-units')
            ]);
            setItems(itemsResponse.data.data || []);
            setMeasurementUnits(unitsResponse.data.data || []);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load item setup.');
        } finally {
            setIsLoading(false);
        }
    }, [notify])

    useEffect(() => {
        loadData();
    }, [loadData]);

    const submitHandler = async (event) => {
        event.preventDefault();
        const itemName = event.target.itemName.value.trim();
        const measurementUnitId = event.target.measurementUnitId.value;
        const rate = event.target.rate.value;

        if (!itemName || !measurementUnitId) {
            notify('error', 'Item name and measurement unit are required.');
            return;
        }

        try {
            const response = await axios.post('/data/items', {
                itemName,
                measurementUnitId,
                rate,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            event.target.reset();
            loadData();
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to save the item.');
        }
    }

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Items</span>
                    <h2 className="mb-2">Add Item</h2>
                    <p className="page-subtitle mb-0">Create a new item with its default measurement unit and starting rate.</p>
                </div>
                <div className="page-badge">Add</div>
            </div>
            <div className="section-card">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">New Item</h5>
                        <p className="section-subtitle mb-0">The selected unit becomes the default unit for order entry autofill.</p>
                    </div>
                </div>
                <form onSubmit={submitHandler}>
                    <div className="row g-3">
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="itemName">Item</label>
                                <input id="itemName" name="itemName" className="form-control app-input" required placeholder="Enter item name" />
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="measurementUnitId">Measurement Unit</label>
                                <select id="measurementUnitId" name="measurementUnitId" className="form-select app-input" required defaultValue="">
                                    <option value="">Select unit</option>
                                    {measurementUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.unit_name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="rate">Rate</label>
                                <input id="rate" name="rate" type="number" step="0.01" min="0" className="form-control app-input" required placeholder="Enter default rate" />
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
                        <h5 className="mb-1">Current Items</h5>
                        <p className="section-subtitle mb-0">These items are available for order entry and can be managed from the other item pages.</p>
                    </div>
                </div>
                {isLoading ? <p className="mb-0">Loading rates...</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Default Unit</th>
                                <th>Default Rate</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.itemName}</td>
                                    <td>{item.defaultMeasurementUnitName || '-'}</td>
                                    <td>{Number(item.defaultRate || 0).toFixed(2)}</td>
                                    <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            </div>
        </section>
    );
}

export default RateManager;
