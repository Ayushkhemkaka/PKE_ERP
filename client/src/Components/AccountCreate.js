import React, { useState } from 'react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext.js';

const initialState = {
    accountName: '',
    address: '',
    contactName: '',
    phone: '',
    gstin: ''
};

const AccountCreate = () => {
    const { currentUser, notify, notifyError } = useAppContext();
    const [formState, setFormState] = useState(initialState);

    const submitHandler = async (event) => {
        event.preventDefault();

        try {
            const response = await axios.post('/data/accounts', {
                ...formState,
                updatedBy: currentUser?.fullName || currentUser?.email || 'System',
                updatedByUserId: currentUser?.id || null
            });
            notify('success', response.data.message);
            setFormState(initialState);
        } catch (error) {
            notifyError(error, 'Unable to create the customer account.');
        }
    }

    return (
        <section className='form-container'>
            <div className="page-heading">
                <div>
                    <span className="page-eyebrow">Accounts</span>
                    <h2 className="mb-2">Create Customer Account</h2>
                    <p className="page-subtitle mb-0">Set up a dedicated B2B customer account so orders, dues, and account analytics roll up correctly.</p>
                </div>
                <div className="page-badge">B2B setup</div>
            </div>
            <form onSubmit={submitHandler}>
                <div className="section-card">
                    <div className="row g-3">
                        <div className="col-lg-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='accountName'>Account Name</label>
                                <input id="accountName" className="form-control app-input" value={formState.accountName} onChange={(event) => setFormState((prev) => ({ ...prev, accountName: event.target.value }))} required placeholder="Customer account name" />
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='address'>Address</label>
                                <input id="address" className="form-control app-input" value={formState.address} onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))} placeholder="Billing or office address" />
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='contactName'>Contact Name</label>
                                <input id="contactName" className="form-control app-input" value={formState.contactName} onChange={(event) => setFormState((prev) => ({ ...prev, contactName: event.target.value }))} placeholder="Contact person" />
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='phone'>Phone</label>
                                <input id="phone" className="form-control app-input" value={formState.phone} onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone number" />
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="app-field">
                                <label className="form-label" htmlFor='gstin'>GSTIN</label>
                                <input id="gstin" className="form-control app-input" value={formState.gstin} onChange={(event) => setFormState((prev) => ({ ...prev, gstin: event.target.value.toUpperCase() }))} placeholder="Customer GST number" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className='action-row mt-4'>
                    <button id="reset" type="button" className="btn btn-outline-secondary btn-lg" onClick={() => setFormState(initialState)}>Reset</button>
                    <button id="submit" type="submit" className="btn btn-success btn-lg">Create Account</button>
                </div>
            </form>
        </section>
    );
}

export default AccountCreate;
