import test from 'node:test';
import assert from 'node:assert/strict';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

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

test('sendSuccess writes success payload with default status', () => {
    const res = createResponse();
    sendSuccess(res, 'Everything ok', { id: 1 });

    assert.equal(res.state.statusCode, 200);
    assert.deepEqual(res.state.body, {
        success: true,
        message: 'Everything ok',
        data: { id: 1 }
    });
});

test('sendError writes error payload with details and status', () => {
    const res = createResponse();
    sendError(res, 'Bad request', 422, { field: 'name' });

    assert.equal(res.state.statusCode, 422);
    assert.deepEqual(res.state.body, {
        success: false,
        message: 'Bad request',
        details: { field: 'name' }
    });
});
