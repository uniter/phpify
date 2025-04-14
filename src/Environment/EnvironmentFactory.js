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
 * Creates the Environment for a loader.
 *
 * @param {class} Environment
 * @constructor
 */
function EnvironmentFactory(Environment) {
    /**
     * @type {class}
     */
    this.Environment = Environment;
}

_.extend(EnvironmentFactory.prototype, {
    /**
     * Creates a new Environment.
     *
     * @param {ModuleRepository} moduleRepository
     * @param {InitialiserContext} initialiserContext
     * @param {Object} phpCoreEnvironment
     * @returns {Environment}
     */
    createEnvironment: function (
        moduleRepository,
        initialiserContext,
        phpCoreEnvironment
    ) {
        return new this.Environment(moduleRepository, initialiserContext, phpCoreEnvironment);
    }
});

module.exports = EnvironmentFactory;
