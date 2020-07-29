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
 * API entry point for creating Loaders for compiled PHP modules to use
 *
 * @param {class} FileSystem
 * @param {class} Loader
 * @param {class} ModuleRepository
 * @param {EnvironmentProvider} environmentProvider
 * @param {ConfigImporter} phpConfigImporter
 * @constructor
 */
function API(
    FileSystem,
    Loader,
    ModuleRepository,
    environmentProvider,
    phpConfigImporter
) {
    /**
     * @type {EnvironmentProvider}
     */
    this.environmentProvider = environmentProvider;
    /**
     * @type {class}
     */
    this.FileSystem = FileSystem;
    /**
     * @type {class}
     */
    this.Loader = Loader;
    /**
     * @type {class}
     */
    this.ModuleRepository = ModuleRepository;
    /**
     * @type {ConfigImporter}
     */
    this.phpConfigImporter = phpConfigImporter;
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
            moduleRepository = new api.ModuleRepository(require.cache),
            fileSystem = new api.FileSystem(moduleRepository);

        return new api.Loader(moduleRepository, fileSystem, api.environmentProvider, api.phpConfigImporter);
    }
});

module.exports = API;
