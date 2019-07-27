const UpdatePolicy = require('../UpdatePolicy');

module.exports = class SemVerUpdatePolicy extends UpdatePolicy {
    /**
     * @param {boolean} major
     * @param {boolean} minor
     * @param {boolean} patch
     */
    constructor(major = false, minor = false, patch = true) {
        super();

        this.updateMajor = major;
        this.updateMinor = minor;
        this.updatePatch = patch;
    }

    /**
     * @param {string} oldV
     * @param {string} newV
     * @return {boolean}
     */
    shouldUpdate(oldV, newV) {
        let oldVer = SemVerUpdatePolicy.parseVersion(oldV);
        let newVer = SemVerUpdatePolicy.parseVersion(newV);
        if (newVer[0] > oldVer[0]) {
            return this.updateMajor;
        }
        if (newVer[1] > oldVer[1]) {
            return this.updateMinor;
        }
        if (newVer[2] > oldVer[2]) {
            return this.updatePatch;
        }
        return false;
    }

    /**
     * @param {string} strVersion
     * @return {Number[]}
     */
    static parseVersion(strVersion) {
        if (strVersion[0] === 'v') {
            strVersion = strVersion.slice(1);
        }
        let pieces = strVersion.split('.');
        while (pieces.length < 3) {
            pieces.push('0');
        }
        return [
            parseInt(pieces[0], 10),
            parseInt(pieces[1], 10),
            parseInt(pieces[2], 10)
        ];
    }
};
