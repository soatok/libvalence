const UpdatePolicy = require('../UpdatePolicy');

module.exports = class ForceUpdatePolicy extends UpdatePolicy {
    /**
     *
     * @param {string} oldV
     * @param {string} newV
     * @returns {boolean}
     */
    shouldUpdate(oldV, newV) {
        return true;
    }
};
