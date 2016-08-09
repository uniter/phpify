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
 * API entry point for creating Loaders for compiled PHP modules to use
 *
 * @param {class} FileSystem
 * @param {class} Loader
 * @param {Object} phpRuntime
 * @constructor
 */
function API(FileSystem, Loader, phpRuntime) {
    /**
     * @type {class}
     */
    this.FileSystem = FileSystem;
    /**
     * @type {class}
     */
    this.Loader = Loader;
    /**
     * @type {Object}
     */
    this.phpRuntime = phpRuntime;
}

_.extend(API.prototype, {
    /**
     * Creates a new, isolated Loader along with a FileSystem
     * and PHPCore/PHPRuntime environment for compiled PHP modules to use
     *
     * @returns {Loader}
     */
    createLoader: function () {
        var api = this,
            fileSystem = new api.FileSystem(),
            environment = api.phpRuntime.createEnvironment({
                fileSystem: fileSystem,
                include: function (filePath, promise) {
                    var result;

                    try {
                        result = fileSystem.compilePHPFile(filePath);
                    } catch (error) {
                        promise.reject(error);
                        return;
                    }

                    promise.resolve(result);
                }
            });

        return new api.Loader(fileSystem, environment);
    }
});

module.exports = API;
