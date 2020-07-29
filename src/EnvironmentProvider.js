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
 * Creates the Environment for a loader
 *
 * @param {Object} phpRuntime
 * @param {Performance} performance
 * @param {IO} io
 * @constructor
 */
function EnvironmentProvider(phpRuntime, performance, io) {
    /**
     * @type {IO}
     */
    this.io = io;
    /**
     * @type {Performance}
     */
    this.performance = performance;
    /**
     * @type {Object}
     */
    this.phpRuntime = phpRuntime;
}

_.extend(EnvironmentProvider.prototype, {
    /**
     * Creates a new Environment
     *
     * @param {FileSystem} fileSystem
     * @param {Object} phpifyConfig
     * @param {Object} phpCoreConfig
     * @returns {Environment}
     */
    createEnvironment: function (fileSystem, phpifyConfig, phpCoreConfig) {
        var provider = this,
            environmentOptions = Object.assign({}, phpCoreConfig, {
                fileSystem: fileSystem,
                include: function (filePath, promise) {
                    var result;

                    try {
                        result = fileSystem.getModuleFactory(filePath);
                    } catch (error) {
                        promise.reject(error);
                        return;
                    }

                    promise.resolve(result);
                },
                performance: provider.performance
            }),
            plugins = environmentOptions.plugins || [], // TODO: Rename to "addons"
            environment;

        delete environmentOptions.plugins;

        environment = provider.phpRuntime.createEnvironment(
            environmentOptions,
            plugins
        );

        provider.io.install(environment, phpifyConfig);

        return environment;
    }
});

module.exports = EnvironmentProvider;
