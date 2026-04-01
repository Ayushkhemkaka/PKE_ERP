import test from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_MODES, getOrderTableName, normalizeOrderMode } from '../utils/orderTables.js';

test('normalizeOrderMode falls back to normal', () => {
    assert.equal(normalizeOrderMode(), ORDER_MODES.normal);
    assert.equal(normalizeOrderMode('cash'), ORDER_MODES.normal);
});

test('normalizeOrderMode accepts b2b and all case-insensitively', () => {
    assert.equal(normalizeOrderMode('B2B'), ORDER_MODES.b2b);
    assert.equal(normalizeOrderMode(' ALL '), ORDER_MODES.all);
});

test('getOrderTableName returns the consolidated order table', () => {
    assert.equal(getOrderTableName(ORDER_MODES.normal), 'order_entry');
    assert.equal(getOrderTableName(ORDER_MODES.b2b), 'order_entry');
});
