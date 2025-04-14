/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

/*jshint evil: true */
'use strict';

var fs = require('fs'),
    globby = require('globby'),
    hasOwn = {}.hasOwnProperty,
    path = require('path'),
    phpConfigImporter = require('phpconfig').configImporter,
    phpConfigLoader = require('phpconfig').createConfigLoader(fs.existsSync),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    asyncPHPRuntime = require('phpruntime/async'),
    psyncPHPRuntime = require('phpruntime/psync'),
    syncPHPRuntime = require('phpruntime/sync'),
    sinon = require('sinon'),
    API = require('../../src/API'),
    Environment = require('../../src/Environment/Environment'),
    EnvironmentFactory = require('../../src/Environment/EnvironmentFactory'),
    EnvironmentProvider = require('../../src/Environment/EnvironmentProvider'),
    FileSystem = require('../../src/FileSystem'),
    InitialiserContext = require('../../src/Initialiser/InitialiserContext'),
    InitialiserLoader = require('../../src/Initialiser/InitialiserLoader'),
    IO = require('../../src/IO'),
    Loader = require('../../src/Loader'),
    ModuleRepository = require('../../src/ModuleRepository'),
    Performance = require('../../src/Performance'),
    Transformer = require('../../src/Transformer'),
    TransformerFactory = require('../../src/TransformerFactory');

module.exports = {
    createContext: function (contextDirectory) {
        var asyncAPI,
            asyncEnvironmentProvider,
            asyncLoader,
            environmentFactory = new EnvironmentFactory(Environment),
            hookedRequire,
            initialiserStubPath = path.resolve(__dirname + '/../../src/php/initialiser_stub.php'),
            initialiserLoader = new InitialiserLoader(function () {
                return hookedRequire(initialiserStubPath);
            }),
            outputLog = [],
            io = new IO({
                info: function (message) {
                    outputLog.push('[info] ' + message);
                },
                warn: function (message) {
                    outputLog.push('[warn] ' + message);
                }
            }),
            syncAPI,
            syncEnvironmentProvider,
            syncLoader,
            performance = new Performance(Date, global),
            psyncAPI,
            psyncEnvironmentProvider,
            psyncLoader,
            requireCache = {},
            requireResolve,
            transformer,
            transformerFactory;

        hookedRequire = function (requirePath) {
            var compiledModule,
                module,
                resolvedModulePath,
                transpiledJS;

            if (!/\.php$/.test(requirePath)) {
                // Async mode is the default
                if (requirePath === '/my/fake/phpify/api' || requirePath === '/my/fake/phpify/api/async') {
                    return asyncLoader;
                }

                if (requirePath === '/my/fake/phpify/api/sync') {
                    return syncLoader;
                }

                if (requirePath === '/my/fake/phpify/api/psync') {
                    return psyncLoader;
                }

                return require(requirePath);
            }

            resolvedModulePath = path.resolve(path.dirname(initialiserStubPath), requirePath);

            if (hasOwn.call(requireCache, resolvedModulePath)) {
                return requireCache[resolvedModulePath];
            }

            module = {
                exports: {},
                id: resolvedModulePath
            };

            transpiledJS = transformer.transform(fs.readFileSync(resolvedModulePath).toString(), resolvedModulePath).code;
            compiledModule = new Function('require', 'module', 'exports', transpiledJS);
            compiledModule(hookedRequire, module, module.exports);

            requireCache[resolvedModulePath] = module.exports;

            return module.exports;
        };
        requireResolve = sinon.stub();

        requireResolve.withArgs('phpify').returns('/my/fake/phpify/index.js');
        requireResolve.withArgs('phpruntime').returns(require.resolve('phpruntime'));

        transformerFactory = new TransformerFactory(
            Transformer,
            phpConfigLoader,
            phpToAST,
            phpToJS,
            requireResolve,
            globby,
            initialiserStubPath
        );

        transformer = transformerFactory.create(contextDirectory);

        asyncEnvironmentProvider = new EnvironmentProvider(environmentFactory, asyncPHPRuntime, performance, io);
        asyncAPI = new API(
            FileSystem,
            Loader,
            ModuleRepository,
            InitialiserContext,
            asyncEnvironmentProvider,
            initialiserLoader,
            phpConfigImporter,
            requireCache
        );
        asyncLoader = asyncAPI.createLoader();

        psyncEnvironmentProvider = new EnvironmentProvider(environmentFactory, psyncPHPRuntime, performance, io);
        psyncAPI = new API(
            FileSystem,
            Loader,
            ModuleRepository,
            InitialiserContext,
            psyncEnvironmentProvider,
            initialiserLoader,
            phpConfigImporter,
            requireCache
        );
        psyncLoader = psyncAPI.createLoader();

        syncEnvironmentProvider = new EnvironmentProvider(environmentFactory, syncPHPRuntime, performance, io);
        syncAPI = new API(
            FileSystem,
            Loader,
            ModuleRepository,
            InitialiserContext,
            syncEnvironmentProvider,
            initialiserLoader,
            phpConfigImporter,
            requireCache
        );
        syncLoader = syncAPI.createLoader();

        return {
            asyncLoader: asyncLoader,
            psyncLoader: psyncLoader,
            syncLoader: syncLoader,

            run: function (modulePath, moduleCode) {
                var module = {exports: {}},
                    transpiledJS = transformer.transform(moduleCode, modulePath).code,
                    compiledModule = new Function('require', 'module', 'exports', transpiledJS);

                compiledModule(hookedRequire, module, module.exports);

                return module.exports;
            },

            outputLog: outputLog
        };
    }
};
