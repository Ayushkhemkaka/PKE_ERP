import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const SourceManager = () => {
    const { currentUser, notify, notifyError } = useAppContext();
    const [sources, setSources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSources = useCallback(async () => {
        try {
            const response = await axios.get('/data/sources', { params: { includeInactive: true } });
            setSources(response.data.data || []);
        } catch (error) {
            notifyError(error, 'Unable to load sources.');
        } finally {
            setIsLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    const submitHandler = async (event) => {
        event.preventDefault();
        const sourceName = event.target.sourceName.value.trim();
        if (!sourceName) {
            notify('error', 'Source name is required.');
            return;
        }

        try {
            const response = await axios.post('/data/sources', {
                sourceName,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            event.target.reset();
            loadSources();
        } catch (error) {
            notifyError(error, 'Unable to save source.');
        }
    };

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Items</span>
                    <h2 className="mb-2">Sources</h2>
                    <p className="page-subtitle mb-0">Add dispatch sources that can be selected on order entry.</p>
                </div>
                <div className="page-badge">Sources</div>
            </div>
            <div className="section-card">
                <div className="section-card-header">
                    <div>
                        <h5 className="mb-1">Add Source</h5>
                        <p className="section-subtitle mb-0">New sources become available immediately for order entry.</p>
                    </div>
                </div>
                <form onSubmit={submitHandler}>
                    <div className="row g-3">
                        <div className="col-lg-4 col-md-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor="sourceName">Source</label>
                                <input id="sourceName" name="sourceName" className="form-control app-input" required placeholder="Enter source name" />
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
                        <h5 className="mb-1">Available Sources</h5>
                    </div>
                </div>
                {isLoading ? <p className="mb-0">Loading sources...</p> : <div className="table-responsive">
                    <table className="table table-hover app-table align-middle">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Status</th>
                                <th>Updated By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sources.map((source) => (
                                <tr key={source.id}>
                                    <td>{source.source_name}</td>
                                    <td>{Number(source.is_active) ? 'Active' : 'Inactive'}</td>
                                    <td>{source.updated_by}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>}
            </div>
        </section>
    );
};

export default SourceManager;
