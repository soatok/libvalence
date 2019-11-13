"use strict";

const Chronicle = require('./CryptoLedger/Chronicle');
const { SodiumPlus } = require('sodium-plus');
let sodium;

module.exports = class Quorum {
    /**
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
     * @returns {Quorum}
     */
    addChronicle(chronicle) {
        this.chronicles.push(chronicle);
        return this;
    }

    /**
     * Your threshold cannot exceed the number of samples you collect,
     * which cannot exceed the number of Chronicles configured.
     *
     * @returns {boolean}
     */
    configIsValid() {
        return (this.threshold <= this.samples)
                &&
            (this.samples <= this.chronicles.length);
    }

    /**
     * @param {string} summaryHash
     * @returns {boolean}
     */
    async consensusAgrees(summaryHash) {
        if (!sodium) sodium = await SodiumPlus.auto();
        if (!this.configIsValid()) {
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
                randomChronicle = await sodium.randombytes_uniform(this.chronicles.length);
                chronicle = this.chronicles[randomChronicle];
                randomRolls++;
                if (randomRolls > maxRolls) {
                    return false;
                }
            } while (consulted.indexOf(randomChronicle) >= 0);
            try {
                await chronicle.lookup(summaryHash);
                consulted.push(randomChronicle);
                found++;
            } catch (e) {
                console.log(e);
            }
            if (found >= this.threshold) {
                // The threshold agrees that this is a valid record
                return true;
            }
        }
        return false;
    }
};
