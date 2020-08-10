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
    phpConfigLoader = require('phpconfig').createConfigLoader(fs.existsSync),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    sinon = require('sinon'),
    Transformer = require('../../src/Transformer'),
    TransformerFactory = require('../../src/TransformerFactory');

describe('Transpilation integration', function () {
    var globby,
        hookedRequire,
        initialiserStubPath,
        requireResolve,
        transformer,
        transformerFactory;

    beforeEach(function () {
        initialiserStubPath = path.resolve(__dirname + '/../../src/php/initialiser_stub.php');
        globby = {
            sync: sinon.stub().returns([])
        };
        hookedRequire = function (path) {
            var compiledModule,
                module,
                transpiledJS;

            if (!/\.php$/.test(path)) {
                return require(path);
            }

            transpiledJS = transformer.transform(fs.readFileSync(path), path).code;
            compiledModule = new Function('require', 'module', 'exports', transpiledJS);
            module = {exports: {}};
            compiledModule(hookedRequire, module, module.exports);

            return module.exports;
        };
        requireResolve = sinon.stub();

        requireResolve.withArgs('phpify').returns(__dirname + '/../../.');
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
});
