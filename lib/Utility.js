"use strict";

const fs = require('fs');
const fsp = fs.promises;
const {
    AsymmetricPublicKey,
    DholeUtil,
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

    /**
     * Does this file exist?
     *
     * @param {string} target
     * @returns {boolean}
     */
    static async exists(target) {
        try {
            let access = await fsp.access(
                target,
                fs.constants.F_OK,
                (err) => {
                    return !err
                }
            );
            return !access;
        } catch (e) {
            return false;
        }
    }

    /**
     * @param {string|Buffer} inputString
     * @param {boolean} raw
     * @returns {Promise<string|Buffer>}
     */
    static async hash(inputString, raw = false) {
        let out = Buffer.alloc(32);
        _sodium.crypto_generichash(out, DholeUtil.stringToBuffer(inputString));
        if (raw) {
            return out;
        }
        return out.toString('hex');
    }

    /**
     *
     * @param {string} path
     * @returns {boolean}
     */
    static async isDir(path) {
        if (!await this.exists(path)) {
            return false;
        }
        let stat = await fsp.stat(path);
        return stat.isDirectory();
    }

    /**
     * @param {string} filename
     * @returns {Object}
     */
    static async readJson(filename) {
        try {
            return JSON.parse(
                await fsp.readFile(
                    filename,
                    {"encoding": "UTF-8", "flag": "r"},
                    (err, data) => {
                        if (err) throw err;
                        return data.toString();
                    }
                )
            );
        } catch (e) {
            return {};
        }
    }
};
