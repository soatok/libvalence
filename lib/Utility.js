"use strict";

const {
    AsymmetricPublicKey,
    _sodium,
    Keyring
} = require('dhole-crypto');
const base64url = require('rfc4648').base64url;

module.exports = class Utility {
    /**
     * Get a Public Key ID from a public key.
     *
     * @param {AsymmetricPublicKey} pubKey
     * @return {string}
     */
    static getPublicKeyId(pubKey) {
        if (!(pubKey instanceof AsymmetricPublicKey)) {
            throw new TypeError('Argument 1 must be an instance of AsymmetricPublicKey');
        }

        let kr = new Keyring();
        let buf = Buffer.alloc(32);
        _sodium.crypto_generichash(buf, Buffer.from(kr.saveAsymmetricPublicKey(pubKey)));
        return base64url.stringify(buf).replace('=', '');
    }
};
