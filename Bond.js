"use strict";

const UpdateFetcher = require('./lib/UpdateFetcher');
const UpdateVerifier = require('./lib/UpdateVerifier');

/**
 * Bond is the public API for libvalence.
 */
module.exports = class Bond {
    constructor(fetcher = null, verifier = null) {
        if (!fetcher) {
            fetcher = new UpdateFetcher();
        }
        if (!verifier) {
            verifier = new UpdateVerifier();
        }
        this.fetcher = fetcher;
        this.verifier = verifier;
    }


    /**
     * Generate a Bond instance from configuration
     *
     * @param {string[]} urls
     * @param {Array<string|AsymmetricPublicKey|Buffer>} publicKeys
     * @param {string} accessToken
     * @return {Bond}
     */
    static fromConfig(urls = [], publicKeys = [], accessToken = '') {
        let fetcher = new UpdateFetcher(urls, accessToken);
        let uv = new UpdateVerifier();

        for (let i = 0; i < publicKeys.length; i++) {
            uv.addPublicKey(publicKeys[i]);
        }
        return new Bond(fetcher, uv);
    }
};