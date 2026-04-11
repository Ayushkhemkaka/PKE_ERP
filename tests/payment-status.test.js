import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCashOnsiteState, buildCollectedOnsiteState, buildPaymentState } from '../utils/paymentStatus.js';

test('buildPaymentState returns full cash for Cash', () => {
    const state = buildPaymentState(1000, 'Cash', {});
    assert.deepEqual(state, {
        dueAmount: 0,
        cashCredit: 1000,
        bankCredit: 0,
        needToCollectCash: false,
        isCollectedCashFromOnsite: false
    });
});

test('buildCashOnsiteState keeps bank credit zero and calculates due from cash', () => {
    const state = buildCashOnsiteState(1000, 750, {});
    assert.deepEqual(state, {
        dueAmount: 250,
        cashCredit: 750,
        bankCredit: 0,
        needToCollectCash: true,
        isCollectedCashFromOnsite: false
    });
});

test('buildPaymentState supports CashOnsite through the shared API', () => {
    const state = buildPaymentState(1000, 'CashOnsite', { cashCredit: 700 });
    assert.equal(state.dueAmount, 300);
    assert.equal(state.cashCredit, 700);
    assert.equal(state.bankCredit, 0);
    assert.equal(state.needToCollectCash, true);
});

test('buildPaymentState defaults CashOnsite to full cash when first selected', () => {
    const state = buildPaymentState(1000, 'CashOnsite', {});
    assert.equal(state.dueAmount, 0);
    assert.equal(state.cashCredit, 1000);
    assert.equal(state.bankCredit, 0);
    assert.equal(state.needToCollectCash, true);
});

test('buildCollectedOnsiteState marks collection complete', () => {
    const state = buildCollectedOnsiteState({ totalAmount: 1000, due_on_create: 300, dueAmount: 300, cashCredit: 700, bankCredit: 0, due_paid: 0 });
    assert.deepEqual(state, {
        paymentStatus: 'CashOnsite',
        dueAmount: 300,
        due_on_create: 300,
        due_paid: 0,
        cashCredit: 700,
        bankCredit: 0,
        needToCollectCash: false,
        isCollectedCashFromOnsite: true
    });
});
