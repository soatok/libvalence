"use strict";

const SemVerUpdatePolicy = require('./lib/UpdatePolicies/SemVerUpdatePolicy');
const UpdateApplier = require('./lib/UpdateApplier');
const UpdateFetcher = require('./lib/UpdateFetcher');
const UpdatePolicy = require('./lib/UpdatePolicy');
const UpdateVerifier = require('./lib/UpdateVerifier');

/**
 * Bond is the public API for libvalence.
 */
module.exports = class Bond {
    /**
     * Instantiate Bond manually.
     *
     * @param {string} projectName
     * @param {string} projectDir
     * @param {UpdateFetcher|null} fetcher
     * @param {UpdateVerifier|null} verifier
     * @param {UpdatePolicy|null} policy
     */
    constructor(
        projectName = '',
        projectDir = '',
        fetcher = null,
        verifier = null,
        policy = null
    ) {
        if (!fetcher) {
            fetcher = new UpdateFetcher();
        }
        if (!verifier) {
            verifier = new UpdateVerifier();
        }
        if (!policy) {
            policy = new SemVerUpdatePolicy();
        }
        this.projectName = projectName;
        this.applier = new UpdateApplier(projectDir);
        this.fetcher = fetcher;
        this.policy = policy;
        this.verifier = verifier;
    }

    /**
     * Generate a Bond instance from configuration
     *
     * @param {string} projectName
     * @param {string} projectDir
     * @param {string[]} urls
     * @param {Array<string|AsymmetricPublicKey|Buffer>} publicKeys
     * @param {string} accessToken
     * @return {Bond}
     */
    static fromConfig(
        projectName = '',
        projectDir = '',
        urls = [],
        publicKeys = [],
        accessToken = ''
    ) {
        let fetcher = new UpdateFetcher(urls, accessToken);
        let uv = new UpdateVerifier();

        for (let i = 0; i < publicKeys.length; i++) {
            uv.addPublicKey(publicKeys[i]);
        }
        return new Bond(projectName, projectDir, fetcher, uv);
    }

    /**
     * Get a list of updates and, if we are meant to apply them,
     * apply the most recent one.
     *
     * @param {string} channel
     * @param {boolean} bypassPolicy
     * @returns {Release}
     */
    async getUpdate(channel = '', bypassPolicy = false) {
        let updateList = this.getUpdateList(channel, bypassPolicy);
        if (updateList.updates.length < 1) {
            return null;
        }
        let updateInfo = updateList.updates.shift();
        await this.fetcher.fetchUpdate(
            updateInfo.url,
            updateList.mirror,
            this.verifier
        );
    }

    /**
     * Get a list of updates and, if we are meant to apply them,
     * apply the most recent one.
     *
     * @param {string} channel
     * @returns {Promise<boolean>}
     */
    async autoUpdate(channel = '') {
        let update = this.getUpdate(channel);
        if (!update) {
            return false;
        }
        return this.applier.doUpdate(update);
    }

    /**
     * @param {string} channel
     * @param {boolean} bypassPolicy
     * @returns {Array<Object>}
     */
    async getUpdateList(channel = '', bypassPolicy = false) {
        let currVersion = await this.applier.getCurrentVersion();
        let updates = await this.fetcher.fetchUpdateList(this.projectName, channel);
        if (bypassPolicy) {
            // Don't apply filtering.
            return updates;
        }
        let candidates = [];
        for (let update of updates.updates) {
            if (this.policy.shouldUpdate(currVersion, update.version)) {
                candidates.push(update);
            }
        }
        return {
            mirror: updates.mirror,
            updates: candidates
        };
    }

    /**
     * Add a public key to the UpdateVerifier.
     *
     * @param {string|Buffer|AsymmetricPublicKey} publicKey
     * @returns {Bond}
     */
    addPublicKey(publicKey) {
        this.verifier.addPublicKey(publicKey);
        return this;
    }

    /**
     * Specify an update policy for determining if an update should be installed.
     *
     * @param {UpdatePolicy} policy
     * @returns {Bond}
     */
    setUpdatePolicy(policy) {
        if (!(policy instanceof UpdatePolicy)) {
            throw new TypeError("Argument 1 must be an instance of UpdatePolicy");
        }
        this.policy = policy;
        return this;
    }

    /**
     * Add an alternative mirror for the update server.
     *
     * @param {string} url
     * @returns {Bond}
     */
    addServerUrl(url) {
        this.fetcher.addMirror(url);
        return this;
    }

    /**
     * Specify the project directory on the local filesystem
     *
     * @param {string} dir
     * @returns {Bond}
     */
    setProjectDirectory(dir) {
        this.applier.projectDir = dir;
        return this;
    }

    /**
     * Set the project name
     *
     * @param {string} name
     * @returns {Bond}
     */
    setProjectName(name) {
        this.projectName = name;
        return this;
    }

    /**
     * Supply an access token to the UpdateFetcher.
     *
     * @param {string} token
     * @returns {Bond}
     */
    setAccessToken(token = '') {
        this.fetcher.accessToken = token;
        return this;
    }
};
