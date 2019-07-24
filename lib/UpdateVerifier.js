"use strict";

const {
    Asymmetric,
    AsymmetricPublicKey,
    _sodium,
    Keyring
} = require('dhole-crypto');
const crypto = require('crypto');
const base64url = require('rfc4648').base64url;

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
     *
     * @param {AsymmetricPublicKey} pubKey
     * @return {string}
     */
    getPublicKeyId(pubKey) {
        if (!(pubKey instanceof AsymmetricPublicKey)) {
            throw new TypeError('Argument 1 must be an instance of AsymmetricPublicKey');
        }
        let kr = new Keyring();
        let buf = Buffer.alloc(32);
        _sodium.crypto_generichash(buf, Buffer.from(kr.saveAsymmetricPublicKey(pubKey)));
        return base64url.stringify(buf).replace('=', '');
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
            curr = Buffer.from(this.getPublicKeyId(this.publicKeys[i]));
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
