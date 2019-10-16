/*
 * PHPify - Browserify transform
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
    beforeEach(function () {
        this.browserFsStubPath = path.resolve(__dirname + '/../../src/php/browser_fs_stub.php');
        this.config = {
            'phpToJS': {
                'include': [
                    'my/path/to/**/*.php'
                ],
                'sync': true
            }
        };
        this.configDir = 'my/path';
        this.globby = {
            sync: sinon.stub().returns([])
        };
        this.phpParser = phpToAST.create(null, {'captureAllBounds': true});
        this.hookedRequire = function (path) {
            var compiledModule,
                exports,
                module,
                transpiledJS;

            if (!/\.php$/.test(path)) {
                return require(path);
            }

            transpiledJS = this.transformer.transform(this.config, fs.readFileSync(path), path, this.configDir);
            compiledModule = new Function('require', 'module', 'exports', transpiledJS);
            exports = {};
            module = {exports: exports};
            compiledModule(this.hookedRequire, module, exports);

            return module.exports;
        }.bind(this);
        this.requireResolve = sinon.stub();

        this.requireResolve.withArgs('phpify').returns(__dirname + '/../../.');
        this.requireResolve.withArgs('phpruntime').returns(require.resolve('phpruntime'));

        this.transformer = new Transformer(
            this.phpParser,
            phpToJS,
            this.requireResolve,
            this.globby,
            this.browserFsStubPath
        );
    });
    
    it('should transpile a simple PHP file to executable JS in synchronous mode', function () {
        var exports = {},
            module = {exports: exports},
            transpiledJS = this.transformer.transform(this.config, '<?php return 21;', 'my/entry.php', this.configDir),
            compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(this.hookedRequire, module, exports);

        expect(module.exports().execute().getNative()).to.equal(21);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "sync" option', function (done) {
        var compiledModule,
            exports = {},
            module = {exports: exports},
            transpiledJS;
        this.config.phpToJS.sync = false; // Use async mode
        transpiledJS = this.transformer.transform(this.config, '<?php return 1001;', 'my/entry.php', this.configDir);
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(this.hookedRequire, module, exports);

        module.exports().execute().then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "mode" option', function (done) {
        var compiledModule,
            exports = {},
            module = {exports: exports},
            transpiledJS;
        delete this.config.phpToJS.sync; // Use async mode
        this.config.phpToJS.mode = 'async';
        transpiledJS = this.transformer.transform(this.config, '<?php return 1001;', 'my/entry.php', this.configDir);
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(this.hookedRequire, module, exports);

        module.exports().execute().then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });

    it('should transpile a simple PHP file to executable JS in Promise-synchronous mode using the "mode" option', function (done) {
        var compiledModule,
            exports = {},
            module = {exports: exports},
            transpiledJS;
        delete this.config.phpToJS.sync; // Use async mode
        this.config.phpToJS.mode = 'psync';
        transpiledJS = this.transformer.transform(this.config, '<?php return 1001;', 'my/entry.php', this.configDir);
        compiledModule = new Function('require', 'module', 'exports', transpiledJS);

        compiledModule(this.hookedRequire, module, exports);

        module.exports().execute().then(function (resultValue) {
            expect(resultValue.getNative()).to.equal(1001);
            done();
        }, done).catch(done);
    });
});
