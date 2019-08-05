# libvalence

[![Support on Patreon](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fsoatok&style=flat)](https://patreon.com/soatok)
[![npm version](https://img.shields.io/npm/v/libvalence.svg)](https://npm.im/libvalence)

Library for secure updates with Soatok's Valence project

## Installing

Use npm to add libvalence as a dependency.

```
npm install --save libvalence
```

## Usage

The public API for libvalence is called `Bond`. Configuration should be
straightforward:

```javascript
const { Bond } = require('libvalence');

// Initialize
let bond = Bond.fromConfig(
    'project-name-goes-here', // Name of the current project
    __dirname + "/app",       // Project directory
    [
        // Update server URLs:
        'https://update-server.example.com',
        'https://backup-server.example.com',
    ],
    [
        // Public keys:
        'public-key-of-publisher-goes-here',
        'other-public-key'
    ]
);

// If the user has an access token (e.g. stored in a text file), you can
// set it like so:
bond.setAccessToken('user-provided access token goes here');

// Add Chronicles, require 2 out of 3 to agree:
bond.addChronicle('https://chronicle.example.com', 'public key goes here')
    .addChronicle('https://chronicle2.example.com', 'public key goes here')
    .addChronicle('https://chronicle3.example.com', 'public key goes here')
    .setQuorumSamples(3)
    .setQuorumThreshold(2);
```

Once your `Bond` is setup and configured, you can use it like so to fetch
updates from the server and install them:

```javascript
/** @var {Bond} bond */
bond.getUpdateList('alpha').then(async (obj) => {
    try {
        let mirror = obj.mirror;
        let update = obj.updates.shift();
        let updateInfo = await fetch.fetchUpdate(update.url, mirror, bond.verifier);
        if (updateInfo.verified) {
            await bond.applier.unzipRelease(updateInfo);
        }
    } catch (e) {
        console.log(e);
    }
});
```

### Update Policies

By default, libvalence uses a **semantic versioning** update policy, which
will automatically apply PATCH updates but *not* MAJOR or MINOR version
changes.

| Old Version | New Version | Auto-Update? |
|-------------|-------------|--------------|
| v1.4.13     | v1.4.14     | YES          |
| v1.4.13     | v1.4.15     | YES          |
| v1.4.13     | v1.5.0      | NO           |
| v1.4.13     | v1.5.14     | NO           |
| v1.4.13     | v2.0.0      | NO           |
| v1.4.13     | v2.5.0      | NO           |
| v1.4.13     | v2.4.14     | NO           |

You can create your own update policy like so:

```javascript
const UpdatePolicy = require('libvalence').UpdatePolicy; 
module.exports = class CustomUpdatePolicy extends UpdatePolicy {
    /**
     * @param {string} oldV
     * @param {string} newV
     * @returns {boolean}
     */
    shouldUpdate(oldV, newV) {
        // Apply your logic here...
        return false;
    }
};
```

And then you can add it to your `Bond` instance like so:

```javascript
const CustomUpdatePolicy = require('./CustomUpdatePolicy');

/** @var {Bond} bond */
bond.setUpdatePolicy(new CustomUpdatePolicy);
```
