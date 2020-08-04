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
    path = require('path'),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    sinon = require('sinon'),
    Transformer = require('../../src/Transformer');

describe('Transpilation integration', function () {
    var contextDirectory,
        globby,
        hookedRequire,
        initialiserStubPath,
        phpCoreConfig,
        phpifyConfig,
        phpParser,
        phpToJSConfig,
        requireResolve,
        transformer;

    beforeEach(function () {
        initialiserStubPath = path.resolve(__dirname + '/../../src/php/initialiser_stub.php');
        phpifyConfig = {};
        phpToJSConfig = {
            'include': [
                'my/path/to/**/*.php'
            ],
            'sync': true
        };
        phpCoreConfig = {
            topLevelConfig: {},
            pluginConfigFilePaths: []
        };
        contextDirectory = 'my/path';
        globby = {
            sync: sinon.stub().returns([])
        };
        phpParser = phpToAST.create(null, {'captureAllBounds': true});
        hookedRequire = function (path) {
            var compiledModule,
                exports,
                module,
                transpiledJS;

            if (!/\.php$/.test(path)) {
                return require(path);
            }

            transpiledJS = transformer.transform(fs.readFileSync(path), path).code;
            compiledModule = new Function('require', 'module', 'exports', transpiledJS);
            exports = {};
            module = {exports: exports};
            compiledModule(hookedRequire, module, exports);

            return module.exports;
        };
        requireResolve = sinon.stub();

        requireResolve.withArgs('phpify').returns(__dirname + '/../../.');
        requireResolve.withArgs('phpruntime').returns(require.resolve('phpruntime'));

        transformer = new Transformer(
            phpParser,
            phpToJS,
            requireResolve,
            globby,
            initialiserStubPath,
            phpifyConfig,
            phpToJSConfig,
            phpCoreConfig,
            contextDirectory
        );
    });

    it('should transpile a simple PHP file to executable JS in synchronous mode', function () {
        var exports = {},
            module = {exports: exports},
            transpiledJS = transformer.transform('<?php return 21;', 'my/entry.php').code,
            compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, exports);

        expect(module.exports.getNative()).to.equal(21);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "sync" option', function (done) {
        var compiledModule,
            exports = {},
            module = {exports: exports},
            transpiledJS;
        phpToJSConfig.sync = false; // Use async mode
        transpiledJS = transformer.transform('<?php return 1001;', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, exports);

        module.exports.then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "mode" option', function (done) {
        var compiledModule,
            exports = {},
            module = {exports: exports},
            transpiledJS;
        delete phpToJSConfig.sync; // Use async mode
        phpToJSConfig.mode = 'async';
        transpiledJS = transformer.transform('<?php return 1001;', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, exports);

        module.exports.then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });

    it('should transpile a simple PHP file to executable JS in Promise-synchronous mode using the "mode" option', function (done) {
        var compiledModule,
            exports = {},
            module = {exports: exports},
            transpiledJS;
        delete phpToJSConfig.sync; // Use psync mode
        phpToJSConfig.mode = 'psync';
        transpiledJS = transformer.transform('<?php return 1001;', 'my/entry.php').code;
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(hookedRequire, module, exports);

        module.exports.then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });
});
