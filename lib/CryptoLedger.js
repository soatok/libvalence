module.exports = class CryptoLedger {
    /**
     * @returns {string}
     */
    latestHash() {
        throw new Error("Not implemented in child class");
    }

    /**
     * @param {string} hash
     * @return {object}
     */
    lookup(hash) {
        throw new Error("Not implemented in child class");
    }

    /**
     * @param {string} hash
     * @return {object[]}
     */
    since(hash) {
        throw new Error("Not implemented in child class");
    }
};
