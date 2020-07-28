/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
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
 * @param {ModuleRepository} moduleRepository
 * @param {Environment} environment
 * @constructor
 */
function Loader(moduleRepository, environment) {
    /**
     * @type {Environment}
     */
    this.environment = environment;
    /**
     * @type {boolean}
     */
    this.isInited = false;
    /**
     * @type {ModuleRepository}
     */
    this.moduleRepository = moduleRepository;
}

_.extend(Loader.prototype, {
    /**
     * Executes zero or more bootstrap modules within the environment.
     * Must be done as a separate method call from .init(...), as the PHP module factory fetcher
     * function installed needs to be available here, because bootstrap modules may themselves
     * be PHP modules (useful for including Composer's autoloader, for example)
     *
     * @param {Function[]} bootstraps
     */
    bootstrap: function (bootstraps) {
        var loader = this;

        // Now execute any bootstraps against the environment, before any modules run
        bootstraps.forEach(function (bootstrap) {
            // If the bootstrap returned a function, invoke it with the environment,
            // otherwise do nothing (the bootstrap module has already had the chance to run)
            if (typeof bootstrap === 'function') {
                bootstrap(loader.environment);
            }
        });
    },

    /**
     * Fetches the module wrapper factory function for a compiled PHP module,
     * if it exists in the compiled bundle
     *
     * @param {string} filePath
     * @returns {Function}
     * @throws {Error} Throws when the specified compiled module does not exist
     */
    getModuleFactory: function (filePath) {
        return this.moduleRepository.getModuleFactory(filePath);
    },

    /**
     * Initializes the Loader with a function
     * for fetching the compiled module wrappers of PHP modules
     *
     * @param {Function} phpModuleFactoryFetcher
     * @returns {Loader} For chaining
     */
    init: function (phpModuleFactoryFetcher) {
        var loader = this;

        // Only init once
        if (loader.isInited) {
            return loader;
        }

        loader.isInited = true;

        loader.moduleRepository.init(phpModuleFactoryFetcher);

        return loader;
    },

    /**
     * Configures the environment and path for the given module, and either executes it
     * and returns the result or just returns the module factory depending on mode.
     * Used by all compiled PHP modules
     *
     * @param {string} filePath
     * @param {Function} moduleFactory
     * @returns {Function|Promise|Value}
     */
    load: function (filePath, moduleFactory) {
        var loader = this;

        return loader.moduleRepository.load(filePath, moduleFactory, loader.environment);
    }
});

module.exports = Loader;
