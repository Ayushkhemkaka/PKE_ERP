import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const defaultRates = [
    { itemName: '10mm', measurementUnit: 'Cft' },
    { itemName: '20mm', measurementUnit: 'Cft' },
    { itemName: 'Dust', measurementUnit: 'Cft' },
    { itemName: 'Sand', measurementUnit: 'Cft' },
    { itemName: 'Local Sand', measurementUnit: 'Cft' },
    { itemName: 'Metal', measurementUnit: 'Tons' },
    { itemName: 'GSB', measurementUnit: 'Tons' }
];

const RateManager = () => {
    const { currentUser, notify } = useAppContext();
    const [rates, setRates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadRates = useCallback(async () => {
        try {
            const response = await axios.get('/data/rates');
            setRates(response.data.data);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load item rates.');
        } finally {
            setIsLoading(false);
        }
    }, [notify])

    useEffect(() => {
        loadRates();
    }, [loadRates]);

    const submitHandler = async (event) => {
        event.preventDefault();
        const itemName = event.target.itemName.value;
        const measurementUnit = event.target.measurementUnit.value;
        const rate = event.target.rate.value;

        try {
            const response = await axios.post('/data/rates', {
                itemName,
                measurementUnit,
                rate,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System'
            });
            notify('success', response.data.message);
            event.target.reset();
            loadRates();
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to save the rate.');
        }
    }

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Pricing</span>
                    <h2 className="mb-2">Item Rate Manager</h2>
                    <p className="page-subtitle mb-0">Maintain the default rate for each item and measurement unit combination used in order entry.</p>
                </div>
                <div className="page-badge">Rates</div>
            </div>
            <div className="section-card">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Set Item Rate</h5>
                        <p className="section-subtitle mb-0">Save or update the standard rate that should auto-fill in order entry.</p>
                    </div>
                </div>
                <form onSubmit={submitHandler}>
                    <div className="row g-3">
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="itemName">Item</label>
                                <input id="itemName" name="itemName" className="form-control app-input" required list="item-rate-list" placeholder="Select or type item" />
                                <datalist id="item-rate-list">
                                    {defaultRates.map((rate) => <option key={`${rate.itemName}-${rate.measurementUnit}`} value={rate.itemName} />)}
                                </datalist>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="measurementUnit">Measurement Unit</label>
                                <input id="measurementUnit" name="measurementUnit" className="form-control app-input" required list="measurement-unit-list" placeholder="Cft / Tons / Other" />
                                <datalist id="measurement-unit-list">
                                    <option value="Cft" />
                                    <option value="Tons" />
                                </datalist>
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
                        <button type="submit" className="btn btn-success btn-lg">Save Rate</button>
                    </div>
                </form>
            </div>
            <div className="section-card mt-4">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Current Rates</h5>
                        <p className="section-subtitle mb-0">These values are used to auto-fill the rate field in order entry.</p>
                    </div>
                </div>
                {isLoading ? <p className="mb-0">Loading rates...</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Measurement Unit</th>
                                <th>Rate</th>
                                <th>Updated By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rates.map((rate) => (
                                <tr key={rate.id}>
                                    <td>{rate.item_name}</td>
                                    <td>{rate.measurement_unit}</td>
                                    <td>{Number(rate.rate).toFixed(2)}</td>
                                    <td>{rate.updated_by}</td>
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
