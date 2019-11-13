module.exports = class CryptoLedger {
    /**
     * @returns {string}
     */
    async latestHash() {
        throw new Error("Not implemented in child class");
    }

    /**
     * @param {string} hash
     * @return {object}
     */
    async lookup(hash) {
        throw new Error("Not implemented in child class");
    }

    /**
     * @param {string} hash
     * @return {object[]}
     */
    async since(hash) {
        throw new Error("Not implemented in child class");
    }
};
