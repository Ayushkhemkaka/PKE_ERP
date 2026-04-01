import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildInvoiceHtml,
    buildMultiInvoiceHtml,
    buildPrintableOrder,
    formatCurrency,
    formatReceiptDate
} from '../client/src/utils/receiptUtils.js';

const sampleOrder = {
    id: '2026/27_1_3',
    orderType: 'B2B',
    bookNumber: 1,
    slipNumber: 3,
    date: '2026-04-02T10:20:00.000Z',
    name: 'General B2B Customer',
    site: 'Main Site',
    source: 'Plant',
    item: '20mm (Tons)',
    measurementUnit: 'Tons',
    quantity: 0,
    gross: 10.125,
    tare: 0.125,
    net: 10,
    rate: 2400,
    amount: 24000,
    freight: 0,
    totalAmount: 24000,
    paymentStatus: 'Due',
    dueAmount: 24000,
    customerGstin: '10AENPK8366A1ZQ',
    remarks: 'Urgent delivery',
    lorryNumber: 'BR01AB1234'
};

test('formatCurrency returns Indian decimal formatting', () => {
    assert.equal(formatCurrency(2400), '2,400.00');
});

test('formatReceiptDate strips time information', () => {
    assert.equal(formatReceiptDate('2026-04-02T10:20:00.000Z'), '2026-04-02');
});

test('buildPrintableOrder derives year and tons-specific display fields', () => {
    const printable = buildPrintableOrder(sampleOrder);

    assert.equal(printable.year, '2026/27');
    assert.equal(printable.receiptReference, 'Book 1 / Slip 3 / 2026/27');
    assert.equal(printable.showQuantity, false);
    assert.equal(printable.net, 10);
    assert.equal(printable.dueAmount, 24000);
});

test('buildInvoiceHtml includes book, slip, year, and logo', () => {
    const printable = buildPrintableOrder(sampleOrder);
    const html = buildInvoiceHtml(printable, 'B2B Order Invoice');

    assert.match(html, /Book No\./);
    assert.match(html, /Slip No\./);
    assert.match(html, /Year/);
    assert.match(html, /\/parentLogo\.png/);
    assert.doesNotMatch(html, /Invoice No\./);
});

test('buildMultiInvoiceHtml renders each selected challan', () => {
    const printable = buildPrintableOrder(sampleOrder);
    const html = buildMultiInvoiceHtml([printable, printable], 'B2B Order Invoice');

    const challanMatches = html.match(/class="challan-card"/g) || [];
    assert.equal(challanMatches.length, 2);
});
