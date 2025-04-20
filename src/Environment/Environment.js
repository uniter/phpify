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
    Promise = require('lie');

/**
 * Represents the PHP environment for a loader.
 *
 * @param {ModuleRepository} moduleRepository
 * @param {InitialiserContext} initialiserContext
 * @param {Object} phpCoreEnvironment
 * @constructor
 */
function Environment(moduleRepository, initialiserContext, phpCoreEnvironment) {
    /**
     * @type {boolean}
     */
    this.bootstrapped = false;
    /**
     * @type {InitialiserContext}
     */
    this.initialiserContext = initialiserContext;
    /**
     * @type {ModuleRepository}
     */
    this.moduleRepository = moduleRepository;
    /**
     * @type {Object}
     */
    this.phpCoreEnvironment = phpCoreEnvironment;
}

_.extend(Environment.prototype, {
    /**
     * Returns the underlying PHPCore environment.
     *
     * @returns {Object}
     */
    getPhpCoreEnvironment: function () {
        return this.phpCoreEnvironment;
    },

    /**
     * Requires a PHP module from JS-land.
     *
     * @param {string} filePath
     * @returns {Promise<Value>}|Value
     */
    requireModule: function (filePath) {
        var bootstraps,
            environment = this,
            mode,
            moduleFactory = environment.moduleRepository.getModuleFactory(filePath),
            phpCoreEnvironment = this.phpCoreEnvironment;

        if (environment.bootstrapped) {
            return moduleFactory({}, phpCoreEnvironment).execute();
        }

        environment.bootstrapped = true;

        bootstraps = environment.initialiserContext.getBootstraps();
        mode = phpCoreEnvironment.getMode();

        if (mode === 'sync') {
            bootstraps.forEach(function (bootstrap) {
                bootstrap(phpCoreEnvironment);
            });

            return moduleFactory({}, phpCoreEnvironment).execute();
        }

        return new Promise(function (resolve, reject) {
            var pendingBootstraps = bootstraps.slice();

            function dequeueBootstrap() {
                var bootstrap,
                    result;

                if (pendingBootstraps.length === 0) {
                    resolve(moduleFactory({}, phpCoreEnvironment).execute());

                    return;
                }

                bootstrap = pendingBootstraps.shift();

                result = bootstrap(phpCoreEnvironment);

                if (result) {
                    result.then(dequeueBootstrap, reject);
                } else {
                    dequeueBootstrap();
                }
            }

            dequeueBootstrap();
        });
    }
});

module.exports = Environment;
