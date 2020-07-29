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
 * Hooks Uniter's PHP stdout and stderr streams up to the console, if available and enabled
 *
 * @param {Console} console
 * @constructor
 */
function IO(console) {
    /**
     * @type {Console}
     */
    this.console = console;
}

_.extend(IO.prototype, {
    /**
     * Hooks the IO for a PHP engine up to the console
     *
     * @param {Environment} environment
     * @param {Object} phpifyConfig
     */
    install: function (environment, phpifyConfig) {
        var io = this;

        if (!io.console) {
            // Console is not available - nothing to do
            return;
        }

        if (phpifyConfig.stdio === false) {
            // Standard I/O has been disabled in config - nothing to do
            return;
        }

        environment.getStdout().on('data', function (data) {
            io.console.info(data);
        });

        environment.getStderr().on('data', function (data) {
            io.console.warn(data);
        });
    }
});

module.exports = IO;
