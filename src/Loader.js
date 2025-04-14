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
 * Public API for compiled PHP modules.
 *
 * @param {ModuleRepository} moduleRepository
 * @param {InitialiserContext} initialiserContext
 * @param {FileSystem} fileSystem
 * @param {EnvironmentProvider} environmentProvider
 * @param {ConfigImporterInterface} phpConfigImporter
 * @constructor
 */
function Loader(
    moduleRepository,
    initialiserContext,
    fileSystem,
    environmentProvider,
    phpConfigImporter
) {
    /**
     * @type {Environment|null} Lazily-initialised by .getEnvironment()
     */
    this.environment = null;
    /**
     * @type {EnvironmentProvider}
     */
    this.environmentProvider = environmentProvider;
    /**
     * @type {FileSystem}
     */
    this.fileSystem = fileSystem;
    /**
     * @type {InitialiserContext}
     */
    this.initialiserContext = initialiserContext;
    /**
     * @type {ModuleRepository}
     */
    this.moduleRepository = moduleRepository;
    /**
     * @type {ConfigImporterInterface}
     */
    this.phpConfigImporter = phpConfigImporter;
    /**
     * @type {Object} Populated from the Initialiser by .configure(...).
     */
    this.phpCoreConfig = {};
    /**
     * @type {Object} Populated from the Initialiser by .configure(...).
     */
    this.phpifyConfig = {};
}

_.extend(Loader.prototype, {
    /**
     * Adds zero or more bootstraps to be executed within the environment.
     * Must be done as a separate method call from .installModules(...), as the PHP module factory fetcher
     * function installed needs to be available here, because bootstrap modules may themselves
     * be PHP modules (useful for including Composer's autoloader, for example).
     *
     * @param {Function} bootstrapFetcher
     * @returns {Loader} For chaining
     */
    bootstrap: function (bootstrapFetcher) {
        var loader = this;

        loader.initialiserContext.bootstrap(bootstrapFetcher);

        return loader;
    },

    /**
     * Populates the PHPify and PHPCore configurations
     *
     * @param {Object} phpifyConfig
     * @param {Object[]} phpCoreConfigs
     * @returns {Loader} For chaining
     */
    configure: function (phpifyConfig, phpCoreConfigs) {
        var loader = this;

        loader.phpifyConfig = phpifyConfig;
        loader.phpCoreConfig = loader.phpConfigImporter
            .importLibrary({configs: phpCoreConfigs})
            .mergeAll();

        return loader;
    },

    /**
     * Creates a new Environment.
     *
     * @param {Object=} phpCoreConfig
     * @param {Object=} phpifyConfig
     * @returns {Environment}
     */
    createEnvironment: function (phpCoreConfig, phpifyConfig) {
        var addons,
            loader = this;

        // TODO: Do something better for config merge as in PHPConfig.
        addons = (loader.phpCoreConfig.addons || []).concat((phpCoreConfig || {}).addons || []);
        phpCoreConfig = Object.assign({}, loader.phpCoreConfig, phpCoreConfig || {});
        phpCoreConfig.addons = addons;

        phpifyConfig = Object.assign({}, loader.phpifyConfig, phpifyConfig || {});

        return loader.environmentProvider.createEnvironment(
            loader.moduleRepository,
            loader.initialiserContext,
            loader.fileSystem,
            phpifyConfig,
            phpCoreConfig
        );
    },

    /**
     * Fetches the Environment for this loader, creating it if necessary
     *
     * @return {Environment}
     */
    getEnvironment: function () {
        var loader = this;

        if (!loader.environment) {
            loader.environment = loader.createEnvironment();
        }

        return loader.environment;
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
     * Installs a function into the loader for fetching the compiled module wrappers of PHP modules
     *
     * @param {Function} phpModuleFactoryFetcher
     * @returns {Loader} For chaining
     */
    installModules: function (phpModuleFactoryFetcher) {
        var loader = this;

        loader.moduleRepository.init(phpModuleFactoryFetcher);

        return loader;
    },

    /**
     * Determines whether this loader has already been initialised
     * (whether the Environment has been created, lazily, when loading a PHP module)
     *
     * @return {boolean}
     */
    isInitialised: function () {
        return this.environment !== null;
    },

    /**
     * Configures the environment and path for the given module, and either executes it
     * and exports the result or just exports the module factory depending on mode.
     * Used by all compiled PHP modules.
     *
     * @param {string} filePath
     * @param {Object} module CommonJS module object
     * @param {Function} moduleFactory
     */
    load: function (filePath, module, moduleFactory) {
        var loader = this,
            configuredModuleFactory;

        if (loader.initialiserContext.isLoadingBootstraps()) {
            module.exports = loader.moduleRepository.loadBootstrap(
                filePath,
                module.id,
                moduleFactory
            );

            return;
        }

        configuredModuleFactory = loader.moduleRepository.load(
            filePath,
            module.id,
            moduleFactory
        );

        if (loader.moduleRepository.isLoadingModuleFactoryOnly()) {
            module.exports = configuredModuleFactory;

            return;
        }

        // A PHP file has been required from JS-land.
        module.exports = loader.getEnvironment().requireModule(filePath);
    },

    /**
     * Adds files to be stubbed within the virtual filesystem for the environment.
     *
     * @param {Object.<string, string>} stubFiles
     * @returns {Loader} For chaining
     */
    stubFiles: function (stubFiles) {
        var loader = this;

        _.forOwn(stubFiles, function (stubFileContents, stubFilePath) {
            loader.fileSystem.writeFile(stubFilePath, stubFileContents);
        });

        return loader;
    }
});

module.exports = Loader;
