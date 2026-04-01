import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const MeasurementUnitManager = () => {
    const { currentUser, notify } = useAppContext();
    const [units, setUnits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUnits = useCallback(async () => {
        try {
            const response = await axios.get('/data/measurement-units', { params: { includeInactive: true } });
            setUnits(response.data.data || []);
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to load measurement units.');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadUnits();
    }, [loadUnits]);

    const submitHandler = async (event) => {
        event.preventDefault();
        const unitName = event.target.unitName.value.trim();
        if (!unitName) {
            notify('error', 'Measurement unit name is required.');
            return;
        }

        try {
            const response = await axios.post('/data/measurement-units', {
                unitName,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            event.target.reset();
            loadUnits();
        } catch (error) {
            notify('error', error.response?.data?.message || 'Unable to save measurement unit.');
        }
    };

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Items</span>
                    <h2 className="mb-2">Units</h2>
                    <p className="page-subtitle mb-0">Add measurement units that can be linked to items and rates.</p>
                </div>
                <div className="page-badge">Units</div>
            </div>
            <div className="section-card">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Add Unit</h5>
                        <p className="section-subtitle mb-0">New units become available for item creation and rate setup.</p>
                    </div>
                </div>
                <form onSubmit={submitHandler}>
                    <div className="row g-3">
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="unitName">Unit</label>
                                <input id="unitName" name="unitName" className="form-control app-input" required placeholder="Enter unit name" />
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
                        <h5 className="mb-1">Available Units</h5>
                    </div>
                </div>
                {isLoading ? <p className="mb-0">Loading units...</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Unit</th>
                                <th>Status</th>
                                <th>Updated By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {units.map((unit) => (
                                <tr key={unit.id}>
                                    <td>{unit.unit_name}</td>
                                    <td>{Number(unit.is_active) ? 'Active' : 'Inactive'}</td>
                                    <td>{unit.updated_by}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            </div>
        </section>
    );
};

export default MeasurementUnitManager;
