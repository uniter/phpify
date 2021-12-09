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

var expect = require('chai').expect,
    fs = require('fs'),
    globby = require('globby'),
    nowdoc = require('nowdoc'),
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
    EnvironmentProvider = require('../../src/EnvironmentProvider'),
    FileSystem = require('../../src/FileSystem'),
    IO = require('../../src/IO'),
    Loader = require('../../src/Loader'),
    ModuleRepository = require('../../src/ModuleRepository'),
    Performance = require('../../src/Performance'),
    Transformer = require('../../src/Transformer'),
    TransformerFactory = require('../../src/TransformerFactory');

describe('Transpilation integration', function () {
    var asyncAPI,
        asyncEnvironmentProvider,
        asyncLoader,
        hookedRequire,
        initialiserStubPath,
        io,
        syncAPI,
        syncEnvironmentProvider,
        syncLoader,
        performance,
        psyncAPI,
        psyncEnvironmentProvider,
        psyncLoader,
        requireCache,
        requireResolve,
        transformer,
        transformerFactory;

    beforeEach(function () {
        initialiserStubPath = path.resolve(__dirname + '/../../src/php/initialiser_stub.php');

        io = new IO(console);
        performance = new Performance(Date, global);
        requireCache = {};

        asyncEnvironmentProvider = new EnvironmentProvider(asyncPHPRuntime, performance, io);
        asyncAPI = new API(FileSystem, Loader, ModuleRepository, asyncEnvironmentProvider, phpConfigImporter, requireCache);
        asyncLoader = asyncAPI.createLoader();

        psyncEnvironmentProvider = new EnvironmentProvider(psyncPHPRuntime, performance, io);
        psyncAPI = new API(FileSystem, Loader, ModuleRepository, psyncEnvironmentProvider, phpConfigImporter, requireCache);
        psyncLoader = psyncAPI.createLoader();

        syncEnvironmentProvider = new EnvironmentProvider(syncPHPRuntime, performance, io);
        syncAPI = new API(FileSystem, Loader, ModuleRepository, syncEnvironmentProvider, phpConfigImporter, requireCache);
        syncLoader = syncAPI.createLoader();

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

            resolvedModulePath = path.resolve(__dirname, requirePath);
            transpiledJS = transformer.transform(fs.readFileSync(resolvedModulePath).toString(), resolvedModulePath).code;
            compiledModule = new Function('require', 'module', 'exports', transpiledJS);
            module = {
                exports: {},
                id: resolvedModulePath
            };
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
    });

    it('should transpile a simple PHP file to executable JS in synchronous mode', function () {
        var module = {exports: {}},
            transpiledJS,
            compiledModule;
        transformer = transformerFactory.create(__dirname + '/fixtures/syncMode');
        transpiledJS = transformer.transform('<?php return 21;', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, module.exports);

        expect(module.exports.getNative()).to.equal(21);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "sync" option', function (done) {
        var compiledModule,
            module = {exports: {}},
            transpiledJS;
        transformer = transformerFactory.create(__dirname + '/fixtures/asyncModeViaSyncOption');
        transpiledJS = transformer.transform('<?php return 1001;', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, module.exports);

        module.exports.then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "mode" option', function (done) {
        var compiledModule,
            module = {exports: {}},
            transpiledJS;
        transformer = transformerFactory.create(__dirname + '/fixtures/asyncModeViaModeOption');
        transpiledJS = transformer.transform('<?php return 1001;', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, module.exports);

        module.exports.then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });

    it('should transpile a simple PHP file to executable JS in Promise-synchronous mode using the "mode" option', function (done) {
        var compiledModule,
            module = {exports: {}},
            transpiledJS;
        transformer = transformerFactory.create(__dirname + '/fixtures/psyncMode');
        transpiledJS = transformer.transform('<?php return 1001;', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, module.exports);

        module.exports.then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });

    it('should allow custom rules to be defined, parsed and transpiled', function () {
        var compiledModule,
            module = {exports: {}},
            transpiledJS;
        transformer = transformerFactory.create(__dirname + '/fixtures/customRule');
        transpiledJS = transformer.transform('<?php return "It is " . §"20mg";', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, module.exports);

        expect(module.exports.getNative()).to.equal('It is 20mg (approx.)');
    });

    it('should allow the "stub" option to stub files', function () {
        var compiledModule,
            module = {exports: {}},
            transpiledJS;
        transformer = transformerFactory.create(__dirname + '/fixtures/stubOption');
        transpiledJS = transformer.transform(
            nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['stubbed with PHP code string'] = require __DIR__ . '/../../../stuff/first_polyfill.php';
$result['stubbed with number'] = require __DIR__ . '/../../../stuff/second_polyfill.php';
$result['stubbed with null'] = require __DIR__ . '/../../../stuff/third_polyfill.php';

return $result;
EOS
*/;}), // jshint ignore:line
            __dirname + '/fixtures/stubOption/my/deep/path/here/entry.php'
        ).code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, module.exports);

        expect(module.exports.getNative()).to.deep.equal({
            'stubbed with PHP code string': 21,
            'stubbed with number': 12345,
            'stubbed with null': null
        });
    });
});
