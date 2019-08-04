const {
    SigningPublicKey,
    Sapient,
} = require('sapient');
const http = require('request-promise-native');
const CryptoLedger = require('../CryptoLedger');

module.exports = class Chronicle extends CryptoLedger {
    /**
     * @param {string} url
     * @param {SigningPublicKey} publicKey
     */
    constructor(url, publicKey) {
        super();
        this.url = url;
        if (typeof(publicKey) === 'string') {
            publicKey = SigningPublicKey.fromString(publicKey);
        }
        this.publicKey = publicKey;
    }

    /**
     * @returns {string}
     */
    async latestHash() {
        let response = await Sapient.decodeSignedJsonResponse(
            await http({
                method: 'GET',
                uri: this.url + "/lasthash",
            }),
            this.publicKey
        );
        if (response.status !== 'OK') {
            throw new Error(response.message);
        }
        return response.results['summary-hash'];
    }

    /**
     * @param {string} hash
     * @return {object}
     */
    async lookup(hash) {
        let response = await Sapient.decodeSignedJsonResponse(
            await http({
                method: 'GET',
                uri: this.url + "/lookup/" + hash,
                resolveWithFullResponse: true
            }),
            this.publicKey
        );
        if (response.status !== 'OK') {
            throw new Error(response.message);
        }
        return response.results;
    }

    /**
     * @param {string} hash
     * @return {object[]}
     */
    async since(hash) {
        let response = await Sapient.decodeSignedJsonResponse(
            await http({
                method: 'GET',
                uri: (hash.length > 0)
                    ? (this.url + "/since/" + hash)
                    : (this.url + "/export"),
            }),
            this.publicKey
        );
        if (response.status !== 'OK') {
            throw new Error(response.message);
        }
        return response.results;
    }
};
