"use strict";

const Chronicle = require('./lib/CryptoLedger/Chronicle');
const Quorum = require('./lib/Quorum');
const Release = require('./lib/Release');
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
     * @param {Quorum|null} quorum
     */
    constructor(
        projectName = '',
        projectDir = '',
        fetcher = null,
        verifier = null,
        policy = null,
        quorum = null
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
        if (!quorum) {
            quorum = new Quorum([]);
        }
        this.projectName = projectName;
        this.applier = new UpdateApplier(projectDir);
        this.fetcher = fetcher;
        this.policy = policy;
        this.quorum = quorum;
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
     * Adds a new Chronicle to the Quorum.
     *
     * @param {string} url
     * @param {string|SigningPublicKey} publicKey
     * @returns {Bond}
     */
    addChronicle(url, publicKey) {
        this.quorum.addChronicle(new Chronicle(url, publicKey));
        return this;
    }

    /**
     * Add a public key to the UpdateVerifier.
     *
     * @param {string|Buffer|AsymmetricPublicKey} publicKey
     * @returns {Bond}
     */
    async addPublicKey(publicKey) {
        await this.verifier.addPublicKey(publicKey);
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
     * Get a list of updates and, if we are meant to apply them,
     * apply the most recent one.
     *
     * @param {string} channel
     * @param {boolean} forceUpdate
     * @returns {Promise<boolean>}
     */
    async autoUpdate(channel = '', forceUpdate = false) {
        let update = this.getUpdate(channel, forceUpdate);
        if (!update) {
            return false;
        }
        if (!this.verifier.verify(update.publicKeyId, update.signature, update.path)) {
            return false;
        }
        if (!this.quorum.consensusAgrees(update.summaryHash)) {
            return false;
        }
        return this.applier.doUpdate(update);
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
     * Supply an access token to the UpdateFetcher.
     *
     * @param {string} token
     * @returns {Bond}
     */
    setAccessToken(token = '') {
        this.fetcher.accessToken = token;
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
     * Set the number of Chronicles we'll query to determine if all of the
     * replicas have a record of the same value.
     *
     * @param {number} int
     * @returns {Bond}
     */
    setQuorumSamples(int) {
        this.quorum.samples = int;
        return this;
    }

    /**
     * Set the number of affirmative responses from various Chronicles
     * are necessary in order to have confidence in the transparency of
     * a record.
     *
     * @param {number} int
     * @returns {Bond}
     */
    setQuorumThreshold(int) {
        this.quorum.threshold = int;
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
};
