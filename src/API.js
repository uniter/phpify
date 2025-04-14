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
 * @param {class} InitialiserContext
 * @param {EnvironmentProvider} environmentProvider
 * @param {InitialiserLoader} initialiserLoader
 * @param {ConfigImporter} phpConfigImporter
 * @param {Object} requireCache
 * @constructor
 */
function API(
    FileSystem,
    Loader,
    ModuleRepository,
    InitialiserContext,
    environmentProvider,
    initialiserLoader,
    phpConfigImporter,
    requireCache
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
    this.InitialiserContext = InitialiserContext;
    /**
     * @type {InitialiserLoader}
     */
    this.initialiserLoader = initialiserLoader;
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
    /**
     * @type {Object}
     */
    this.requireCache = requireCache;
}

_.extend(API.prototype, {
    /**
     * Creates a new, isolated Loader along with a FileSystem
     * and PHPCore/PHPRuntime environment for compiled PHP modules to use.
     *
     * @returns {Loader}
     */
    createLoader: function () {
        var api = this,
            initialiserContext = new api.InitialiserContext(),
            moduleRepository = new api.ModuleRepository(api.requireCache),
            fileSystem = new api.FileSystem(moduleRepository),
            loader = new api.Loader(
                moduleRepository,
                initialiserContext,
                fileSystem,
                api.environmentProvider,
                api.phpConfigImporter
            ),
            initialiser = api.initialiserLoader.loadInitialiser();

        initialiser(loader);

        return loader;
    }
});

module.exports = API;
