"use strict";

const fs = require('fs');
const fsp = fs.promises;
const {
    AsymmetricPublicKey,
    DholeUtil,
    Keyring
} = require('dhole-crypto');
const base64url = require('rfc4648').base64url;
const { SodiumPlus } = require('sodium-plus');
let sodium;

module.exports = class Utility {
    /**
     * Get a Public Key ID from a public key.
     *
     * @param {AsymmetricPublicKey} pubKey
     * @return {string}
     */
    static async getPublicKeyId(pubKey) {
        if (!sodium) sodium = await SodiumPlus.auto();
        let kr = new Keyring();
        let buf = await sodium.crypto_generichash(
            await kr.saveAsymmetricPublicKey(pubKey)
        );
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
            await fsp.access(target, fs.constants.F_OK);
            return true;
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
        if (!sodium) sodium = await SodiumPlus.auto();
        let out = await sodium.crypto_generichash(
            DholeUtil.stringToBuffer(inputString)
        );
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
                (await fsp.readFile(
                    filename,
                    {"encoding": "UTF-8", "flag": "r"}
                )).toString()
            );
        } catch (e) {
            return {};
        }
    }

    /**
     * Write a JSON file.
     *
     * @param {string} filename
     * @param {object} obj
     * @returns {Promise<void>}
     */
    static async writeJson(filename, obj) {
        return await fsp.writeFile(filename, JSON.stringify(obj));
    }
};
