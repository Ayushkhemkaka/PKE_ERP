import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEntryId, formatDateKey, getNextBookSlip } from '../controllers/insert.js';

test('buildEntryId uses the financial year that starts in April', () => {
    assert.equal(buildEntryId(1, 1, '2026-04-02'), '2026/27_1_1');
    assert.equal(buildEntryId(4, 12, '2026-01-05'), '2025/26_4_12');
});

test('formatDateKey normalizes the date to YYYY-MM-DD', () => {
    assert.equal(formatDateKey('2026-04-02T10:20:00.000Z'), '2026-04-02');
});

test('getNextBookSlip starts a new financial year at book 1 slip 1 when empty', async () => {
    const mockDb = {
        execute: async () => [[]]
    };

    const result = await getNextBookSlip(mockDb, '2026-04-02');
    assert.deepEqual(result, { bookNumber: 1, slipNumber: 1 });
});

test('getNextBookSlip increments slip number until 50', async () => {
    const mockDb = {
        execute: async () => [[[{ booknumber: 3, slipnumber: 17 }][0]]]
    };

    const result = await getNextBookSlip(mockDb, '2026-04-02');
    assert.deepEqual(result, { bookNumber: 3, slipNumber: 18 });
});

test('getNextBookSlip rolls over to the next book after slip 50', async () => {
    const mockDb = {
        execute: async () => [[[{ booknumber: 3, slipnumber: 50 }][0]]]
    };

    const result = await getNextBookSlip(mockDb, '2026-04-02');
    assert.deepEqual(result, { bookNumber: 4, slipNumber: 1 });
});
