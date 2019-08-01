"use strict";

const Chronicle = require('./CryptoLedger/Chronicle');
const sodium = require('dhole-crypto')._sodium;

module.exports = class Quorum {
    /**
     *
     * @param {Chronicle[]} chronicles
     * @param {number} samples
     * @param {number} threshold
     */
    constructor(chronicles = [], samples = 1, threshold = 1) {
        this.chronicles = chronicles;
        this.samples = samples;
        this.threshold = threshold;
    }

    /**
     * @param {Chronicle} chronicle
     * @returns Quorum
     */
    addChronicle(chronicle) {
        this.chronicles.push(chronicle);
        return this;
    }

    /**
     * @param {string} str
     * @returns {boolean}
     */
    async consensusAgrees(str) {
        if (this.threshold > this.samples) {
            return false;
        }
        if (this.samples > this.chronicles.length) {
            return false;
        }
        if (this.threshold > this.chronicles.length) {
            return false;
        }
        let randomChronicle;
        let randomRolls = 0;
        let maxRolls = (this.chronicles.length + 1) * (this.chronicles.length + 1);
        let found = 0;
        let chronicle;
        let consulted = [];
        for (let checked = 0; checked < this.samples; checked++) {
            randomRolls = 0;
            do {
                randomChronicle = sodium.randombytes_uniform(this.chronicles.length);
                chronicle = this.chronicles[randomChronicle];
                randomRolls++;
                if (randomRolls > maxRolls) {
                    return false;
                }
            } while (consulted.indexOf(randomChronicle) >= 0);
            try {
                await chronicle.lookup(str);
                consulted.push(randomChronicle);
                found++;
            } catch (e) {
            }
            if (found >= this.threshold) {
                // The threshold agrees that this is a valid record
                return true;
            }
        }
        return false;
    }
};
