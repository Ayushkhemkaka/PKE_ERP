import test from 'node:test';
import assert from 'node:assert/strict';
import authHandler from '../pages/api/auth/[action].js';
import dataHandler from '../pages/api/data/[...slug].js';

const createResponse = () => {
    const state = {
        statusCode: 200,
        body: null
    };

    return {
        state,
        status(code) {
            state.statusCode = code;
            return this;
        },
        json(payload) {
            state.body = payload;
            return this;
        }
    };
};

test('auth API returns 404 for unknown routes', async () => {
    const req = { method: 'POST', query: { action: 'missing' } };
    const res = createResponse();

    await authHandler(req, res);

    assert.equal(res.state.statusCode, 404);
    assert.equal(res.state.body.message, 'API route not found.');
});

test('auth API returns 405 for unsupported methods', async () => {
    const req = { method: 'GET', query: { action: 'login' } };
    const res = createResponse();

    await authHandler(req, res);

    assert.equal(res.state.statusCode, 405);
    assert.equal(res.state.body.message, 'Method GET not allowed.');
});

test('data API returns 404 for unknown routes', async () => {
    const req = { method: 'GET', query: { slug: ['unknown'] } };
    const res = createResponse();

    await dataHandler(req, res);

    assert.equal(res.state.statusCode, 404);
    assert.equal(res.state.body.message, 'API route not found.');
});

test('data API returns 405 for unsupported methods', async () => {
    const req = { method: 'DELETE', query: { slug: ['find'] } };
    const res = createResponse();

    await dataHandler(req, res);

    assert.equal(res.state.statusCode, 405);
    assert.equal(res.state.body.message, 'Method DELETE not allowed.');
});
