"use strict";

const http = require('request-promise-native');
const sodium = require('sodium-native');
const fs = require('fs');
const fsp = fs.promises;
const Release = require('./Release');
const tmp = require('tmp-promise');
const UpdateVerifier = require('./UpdateVerifier');

module.exports = class UpdateFetcher {
    constructor(mirrors = [], accessToken = '') {
        if (typeof (mirrors) === 'string') {
            mirrors = [mirrors];
        }
        this.mirrors = mirrors;
        this.accessToken = accessToken;
    }

    /**
     * @param {string} mirror
     * @returns {UpdateFetcher}
     */
    addMirror(mirror) {
        if (typeof (mirror) !== "string") {
            throw new TypeError('addMirror() expects a string');
        }
        this.mirrors.push(mirror);
        return this;
    }

    /**
     * @param {string} token
     * @returns {UpdateFetcher}
     */
    setAccessToken(token) {
        if (typeof (token) !== "string") {
            throw new TypeError('setAccessToken() expects a string');
        }
        this.accessToken = token;
        return this;
    }

    /**
     * @returns {string}
     */
    getRandomMirror() {
        let index = sodium.randombytes_uniform(this.mirrors.length);
        return this.mirrors[index];
    }

    /**
     * Fetch an update object
     *
     * @param {string} downloadPath
     * @param {string|null} mirror
     * @param {UpdateVerifier|null} verifier
     * @returns {Release}
     */
    async fetchUpdate(downloadPath, mirror = null, verifier = null) {
        if (!mirror) {
            mirror = this.getRandomMirror();
        }
        let response = await http({
            "uri": mirror + downloadPath,
            "headers": {
                "Valence-Access": this.accessToken
            },
            encoding: null,
            // necessary to get headers:
            resolveWithFullResponse: true
        });
        let publicKeyID = response.headers['valence-public-key-id'];
        let signature = response.headers['valence-signature'];
        let summaryHash = response.headers['chronicle-summary-hash'];

        // We don't actually need fd
        let {fd, path} = await tmp.file({prefix: 'valence-', postfix: '.zip'});

        await fsp.writeFile(path, response.body);
        // If a verifier was passed, verify signature
        let verified = false;
        if (verifier instanceof UpdateVerifier) {
            verified = await verifier.verify(publicKeyID, signature, path);
        }
        return new Release(path, signature, publicKeyID, summaryHash, verified);
    }

    /**
     * Fetch a list of updates for this project.
     * {
     *     "channel": "public/alpha/beta/nightly",
     *     "created": "timestamp",
     *     "publisher": "company name",
     *     "project": "project name", -- should match what we passed
     *     "url": "/download/projectname/uniquefileid" -- to actually download
     * }
     *
     * @param {string} projectName
     * @param {string} channel
     * @return {Array}
     */
    async fetchUpdateList(projectName = '', channel = '') {
        let mirror = this.getRandomMirror();
        let uri = mirror + "/updates/" + projectName;
        if (channel.length > 0) {
            uri += "/" + channel;
        }
        return await http({
            uri: uri,
            headers: {
                "Valence-Access": this.accessToken
            },
            json: true
        }).then(async (parsed) => {
            if (typeof (parsed.updates) === "undefined") {
                throw new Error(parsed.info);
            }
            return {
                'mirror': mirror,
                'updates': parsed.updates
            };
        }).catch ((e) => {
            console.error(e);
            return [];
        });
    }
};
