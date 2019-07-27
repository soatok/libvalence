module.exports = class UpdatePolicy {
    /**
     * @param {string} oldV
     * @param {string} newV
     * @return {boolean}
     */
    shouldUpdate(oldV, newV) {
        return false;
    }
};
