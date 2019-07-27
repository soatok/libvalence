"use strict";

const {
    AsymmetricFile,
    AsymmetricPublicKey,
    Keyring
} = require('dhole-crypto');
const fsp = require('fs').promises;
const crypto = require('crypto');
const Utility = require('./Utility');

module.exports = class UpdateVerifier {
    constructor(publicKeys = []) {
        this.publicKeys = publicKeys;
    }

    /**
     * Adds a public key to this instance of UpdateVerifier
     *
     * @param {string|AsymmetricPublicKey} key
     * @returns {UpdateVerifier}
     * @throws {TypeError}
     */
    addPublicKey(key) {
        if (key instanceof AsymmetricPublicKey) {
            this.publicKeys.push(key);
            return this;
        }

        let kr = new Keyring();
        if (typeof key === 'string') {
            this.publicKeys.push(kr.loadAsymmetricPublicKey(key));
            return this;
        }

        if (Buffer.isBuffer(key)) {
            this.publicKeys.push(kr.loadAsymmetricPublicKey(key.toString()));
            return this;
        }

        throw new TypeError('Invalid public key');
    }

    /**
     * Verify a file's contents against a public key (by ID)
     *
     * @param {string} publicKeyID
     * @param {string} signature
     * @param {string} filePath
     * @returns {boolean}
     */
    async verify(publicKeyID, signature, filePath) {
        if (this.publicKeys.length < 1) {
            return false;
        }
        let keyID = Buffer.from(publicKeyID);
        let fh = await fsp.open(filePath, 'r');

        let curr;
        for (let i = 0; i < this.publicKeys.length; i++) {
            curr = Buffer.from(Utility.getPublicKeyId(this.publicKeys[i]));
            if (crypto.timingSafeEqual(keyID, curr)) {
                // Only returns true if signature is valid
                return AsymmetricFile.verify(fh, this.publicKeys[i], signature);
            }
        }
        return false;
    }
};
