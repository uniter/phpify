/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    hasOwn = {}.hasOwnProperty,
    path = require('path'),
    Promise = require('lie');

/**
 * Virtual FileSystem for use in the browser with compiled PHP modules
 *
 * @param {ModuleRepository} moduleRepository
 * @constructor
 */
function FileSystem(moduleRepository) {
    /**
     * @type {Object.<string, string>}
     */
    this.files = {};
    /**
     * @type {ModuleRepository}
     */
    this.moduleRepository = moduleRepository;
}

_.extend(FileSystem.prototype, {
    /**
     * Fetches the module wrapper factory function for a compiled PHP module,
     * if it exists in the compiled bundle
     *
     * @param {string} filePath
     * @returns {Function}
     * @throws {Error} Throws when the specified compiled module does not exist
     */
    getModuleFactory: function (filePath) {
        var fileSystem = this;

        filePath = fileSystem.realPath(filePath);

        // TODO: If a PHP source file has been written to the virtual FS, and eval-ish support
        //       is installed, allow the dynamically-generated module to be compiled and run

        return fileSystem.moduleRepository.getModuleFactory(filePath);
    },

    /**
     * Determines whether the specified directory path exists in the FileSystem.
     * Currently always returns true, as we cannot be sure from the info we have
     *
     * @returns {boolean}
     */
    isDirectory: function () {
        // TODO: Implement once we have support for non-PHP files in the VFS
        return false;
    },

    /**
     * Determines whether the specified file exists in the FileSystem.
     * Currently only compiled PHP modules can be in the FileSystem, so only those
     * may be detected.
     *
     * @param {string} filePath
     * @returns {boolean}
     */
    isFile: function (filePath) {
        var fileSystem = this;

        filePath = fileSystem.realPath(filePath);

        return hasOwn.call(fileSystem.files, filePath) ||
            fileSystem.moduleRepository.moduleExists(filePath);
    },

    /**
     * Opens a Stream for the specified file asynchronously
     *
     * @param {string} filePath
     * @returns {Promise} Resolves with a Stream for the file on success, rejects on failure
     */
    open: function (filePath) {
        return new Promise(function (resolve, reject) {
            reject(new Error('Could not open "' + filePath + '" :: Streams are not currently supported by PHPify'));
        });
    },

    /**
     * Opens a Stream for the specified file synchronously
     *
     * @param {string} filePath
     * @returns {Stream}
     */
    openSync: function (filePath) {
        throw new Error('Could not open "' + filePath + '" :: Streams are not currently supported by PHPify');
    },

    /**
     * Converts the specified module path to a full one,
     * normalizing any parent- or current-directory symbols
     *
     * @param {string} filePath
     * @returns {string}
     */
    realPath: function (filePath) {
        filePath = path.normalize(filePath);

        // Strip any leading slash, as the virtual FS does not expect it
        filePath = filePath.replace(/^\/+/, '');

        return filePath;
    },

    /**
     * Deletes a file or folder asynchronously
     *
     * @param {string} filePath
     * @returns {Promise} Resolves on success, rejects on failure
     */
    unlink: function (filePath) {
        return new Promise(function (resolve, reject) {
            reject(new Error('Could not delete "' + filePath + '" :: not currently supported by PHPify'));
        });
    },

    /**
     * Deletes a file or folder synchronously
     *
     * @param {string} filePath
     */
    unlinkSync: function (filePath) {
        throw new Error('Could not delete "' + filePath + '" :: not currently supported by PHPify');
    },

    /**
     * Writes the contents of a file to the virtual FileSystem.
     *
     * @param {string} path
     * @param {string} contents
     */
    writeFile: function (path, contents) {
        var fileSystem = this;

        fileSystem.files[path] = contents;
    }
});

module.exports = FileSystem;
