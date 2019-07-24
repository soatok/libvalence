"use strict";

module.exports = {
    UpdateFetcher: require('./lib/UpdateFetcher'),
    UpdateVerifier: require('./lib/UpdateVerifier')
};

/*
1. Check for updates from valence-updateserver.
   a. Send the access token (if it exists) and channel (default: public)
   b. Parse response.
2. If an update is found, download it and the signature.
3. Verify the signature against one of the local public keys.
4. If the signature is valid, either:
   a. check that this information was committed to the configured cryptographic
      ledger (Trillian / Chronicle), OR
   b. defer our commitment check to a trusted third party (or a quorum of
      multiple third parties).
5. If the signature and commitment are valid (whether verified locally
   or deferred), apply the update.
*/
