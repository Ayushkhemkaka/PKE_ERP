import crypto from 'crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

const hashPassword = (password) => new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
});

const verifyPassword = (password, storedHash) => new Promise((resolve, reject) => {
    const [salt, key] = (storedHash || '').split(':');
    if (!salt || !key) {
        resolve(false);
        return;
    }
    crypto.scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
            reject(error);
            return;
        }
        resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
});

export { hashPassword, verifyPassword }
