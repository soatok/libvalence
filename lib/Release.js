module.exports = class Release {
    constructor(path = '', signature = '', publicKeyId = '', summaryHash = '', verified = false) {
        this.path = path;
        this.signature = signature;
        this.publicKeyId = publicKeyId;
        this.summaryHash = summaryHash;
        this.verified = verified;
    }
};
