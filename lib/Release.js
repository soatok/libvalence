module.exports = class Release {
    constructor(path = '', signature = '', publicKeyId = '', verified = false) {
        this.path = path;
        this.signature = signature;
        this.publicKeyId = publicKeyId;
        this.verified = verified;
    }
};
