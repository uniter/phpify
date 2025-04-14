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
 * Loads the PHP initialiser.
 *
 * @param {Function} initialiserRequirer
 * @constructor
 */
function InitialiserLoader(initialiserRequirer) {
    /**
     * @type {Function}
     */
    this.initialiserRequirer = initialiserRequirer;
}

_.extend(InitialiserLoader.prototype, {
    /**
     * Loads the initialiser via the registered requirer.
     *
     * @returns {Function}
     */
    loadInitialiser: function () {
        return this.initialiserRequirer();
    },

    /**
     * Installs a new initialiser requirer.
     *
     * @param {Function} initialiserRequirer
     */
    setRequirer: function (initialiserRequirer) {
        this.initialiserRequirer = initialiserRequirer;
    }
});

module.exports = InitialiserLoader;
