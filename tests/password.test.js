import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../utils/password.js';

test('hashPassword returns salt and key format', async () => {
    const hash = await hashPassword('Secret@123');
    const [salt, key] = hash.split(':');

    assert.ok(salt);
    assert.ok(key);
    assert.notEqual(hash, 'Secret@123');
});

test('verifyPassword returns true for the correct password', async () => {
    const hash = await hashPassword('Secret@123');
    const isValid = await verifyPassword('Secret@123', hash);

    assert.equal(isValid, true);
});

test('verifyPassword returns false for the wrong password', async () => {
    const hash = await hashPassword('Secret@123');
    const isValid = await verifyPassword('Wrong@123', hash);

    assert.equal(isValid, false);
});

test('verifyPassword returns false for malformed hashes', async () => {
    const isValid = await verifyPassword('Secret@123', 'invalid-hash');
    assert.equal(isValid, false);
});
