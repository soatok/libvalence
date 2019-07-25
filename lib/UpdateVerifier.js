"use strict";

const {
    Asymmetric,
    AsymmetricPublicKey,
    Keyring
} = require('dhole-crypto');
const crypto = require('crypto');
const Utility = require('./Utility');

/**
 *
 *
 * @type {module.UpdateVerifier}
 */
module.exports = class UpdateVerifier {
    constructor(publicKeys = []) {
        this.publicKeys = publicKeys;
    }

    /**
     *
     * @param {string|AsymmetricPublicKey} key
     * @returns {module.UpdateVerifier}
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
     * @param {string} fileContents
     * @return {boolean}
     */
    verify(publicKeyID, signature, fileContents) {
        if (this.publicKeys.length < 1) {
            return false;
        }
        let keyID = Buffer.from(publicKeyID);

        let curr;
        for (let i = 0; i < this.publicKeys.length; i++) {
            curr = Buffer.from(Utility.getPublicKeyId(this.publicKeys[i]));
            if (crypto.timingSafeEqual(keyID, curr)) {
                return Asymmetric.verify(
                    fileContents,
                    this.publicKeys[i],
                    signature
                );
            }
        }
        return false;
    }
};
