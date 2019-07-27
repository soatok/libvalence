"use strict";

const copy = require('recursive-copy');
const del = require('del');
const fs = require('fs');
const fsp = fs.promises;
const JSZip = require('jszip');
const path = require('path');
const Release = require('./Release');
const Utility = require('./Utility');

module.exports = class UpdateApplier {
    /**
     * @param {string} projectDir
     */
    constructor(projectDir = '') {
        this.projectDir = projectDir;
        this.rollbackBaseDir = UpdateApplier.upOneDir(projectDir) + "/.rollback";
        this.message = '';
    }

    /**
     * @returns {string}
     */
    getMessage() {
        return this.message;
    }

    /**
     * @returns {string}
     */
    async getCurrentVersion() {
        let path = this.projectDir + "/valence.json";
        if (!await Utility.isDir(this.projectDir)) {
            throw new Error(`Not a directory: ${this.projectDir}`);
        }
        if (!await Utility.exists(path)) {
            throw new Error(`Could not find config: ${path}`);
        }
        let valence = await Utility.readJson(path);
        if (typeof (valence.version) === 'undefined') {
            throw new Error("No 'version' key present in JSON file at root level.");
        }
        return valence.version;
    }

    /**
     * Get an empty rollback directory from the current version.
     *
     * @returns {string}
     */
    async rollbackDir() {
        let currVersionHash = await Utility.hash(await this.getCurrentVersion());
        if (!await Utility.exists(this.rollbackBaseDir)) {
            await fsp.mkdir(this.rollbackBaseDir);
        }
        if (await Utility.exists(this.rollbackBaseDir + "/" + currVersionHash)) {
            // Delete rollback
            await del(
                [this.rollbackBaseDir + "/" + currVersionHash + "/**"],
                {"force": true}
            );
            await fsp.rmdir(this.rollbackBaseDir + "/" + currVersionHash);
        }
        await fsp.mkdir(this.rollbackBaseDir + "/" + currVersionHash);
        return this.rollbackBaseDir + "/" + currVersionHash;
    }

    /**
     * Actually applies an update, given a Release object.
     *
     * @param {Release} update
     * @return {boolean}
     */
    async doUpdate(update) {
        if (!update.verified) {
            this.message = 'Update not verified, cannot be trusted.';
            return false;
        }

        // Make a backup of the current project
        let rollback = await this.rollbackDir();
        await copy(this.projectDir, rollback);

        // Extract new files...
        return await this.unzipRelease(update);
    }

    /**
     * Unzip the release file.
     *
     * @param {Release} update
     */
    async unzipRelease(update) {
        let zip = await JSZip.loadAsync(await fsp.readFile(update.path));

        let file;
        for (let f in zip.files) {
            if (!zip.files.hasOwnProperty(f)) {
                // Inherited property check.
                continue;
            }

            file = zip.files[f];
            if (file.dir) {
                await fsp.mkdir(this.projectDir + "/" + file.name);
            } else {
                await fsp.writeFile(
                    this.projectDir + "/" + file.name,
                    await zip.file(f).async('nodebuffer')
                );
            }
        }
        return true;
    }

    /**
     * @param {string} str
     * @returns {string}
     */
    static upOneDir(str) {
        let pieces = path.basename(str).split('/');
        pieces.pop();
        return pieces.join('/');
    }
};
