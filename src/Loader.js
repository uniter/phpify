/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

/**
 * Public API for compiled PHP modules
 *
 * @param {FileSystem} fileSystem
 * @param {Environment} environment
 * @constructor
 */
function Loader(fileSystem, environment) {
    /**
     * @type {Environment}
     */
    this.environment = environment;
    /**
     * @type {FileSystem}
     */
    this.fileSystem = fileSystem;
    /**
     * @type {boolean}
     */
    this.isInited = false;
}

_.extend(Loader.prototype, {
    /**
     * Fetches the compiled module wrapper of a PHP module, if it exists
     *
     * @param {string} filePath
     * @returns {Function|null}
     */
    compilePHPFile: function (filePath) {
        return this.fileSystem.compilePHPFile(filePath);
    },

    /**
     * Initializes the Loader with a function
     * for fetching the compiled module wrappers of PHP modules
     *
     * @param {Function} phpModuleFactoryFetcher
     */
    init: function (phpModuleFactoryFetcher) {
        var loader = this;

        // Only init once
        if (loader.isInited) {
            return;
        }

        loader.isInited = true;

        loader.fileSystem.init(phpModuleFactoryFetcher);
    },

    /**
     * Creates a new module wrapper from the provided one, with its "path" option
     * set to the specified one. Used by all compiled PHP modules
     *
     * @param {string} filePath
     * @param {Function} moduleFactory
     * @returns {Function}
     */
    load: function (filePath, moduleFactory) {
        return moduleFactory.using({path: filePath}, this.environment);
    }
});

module.exports = Loader;
