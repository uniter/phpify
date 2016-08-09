/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    nowdoc = require('nowdoc'),
    sinon = require('sinon'),
    Transformer = require('../../src/Transformer');

describe('Transformer', function () {
    beforeEach(function () {
        this.config = {};
        this.content = '';
        this.globby = {
            sync: sinon.stub()
        };
        this.parserState = {
            setPath: sinon.stub()
        };
        this.phpParser = {
            getState: sinon.stub().returns(this.parserState),
            parse: sinon.stub()
        };
        this.phpToJS = {
            transpile: sinon.stub().returns('(function () { return "transpiler result"; }());')
        };
        this.resolveRequire = sinon.stub();
        this.transformer = new Transformer(this.phpParser, this.phpToJS, this.resolveRequire, this.globby);

        this.resolveRequire.withArgs('phpify').returns('/path/to/node_modules/phpify/index.js');
        this.resolveRequire.withArgs('phpruntime').returns('/path/to/node_modules/phpruntime/index.js');

        this.callTransform = function (file, configDir) {
            return this.transformer.transform(
                this.config,
                this.content,
                file || '/path/to/my/file.js',
                configDir || '/path/to/the/configdir'
            );
        }.bind(this);
    });

    describe('for the entry file', function () {
        it('should include the PHP module factory fetcher and entry module factory', function () {
            var expectedJS = nowdoc(function () {/*<<<EOS
require("/path/to/node_modules/phpify/api").init(function (path, checkExistence) {
    var exists = false;

    function handlePath(aPath) {
        if (!checkExistence) {
            return aPath;
        }

        if (aPath === path) {
            exists = true;
        }

        return null;
    }

    switch (path) {
    case handlePath("../../../../my/first/matched/file.js"): return require("./../../../my/first/matched/file.js");
    case handlePath("../../../../my/second/matched/file.js"): return require("./../../../my/second/matched/file.js");
    }

    return checkExistence ? exists : null;
});
module.exports = require("/path/to/node_modules/phpify/api").load("../../my/file.js", (function () { return "transpiler result"; }()));
EOS*/;}); // jshint ignore:line

            this.globby.sync.withArgs([
                '/path/to/the/configdir/my/first/**/*.php',
                '/path/to/the/configdir/my/second/**/*.php'
            ]).returns([
                '/my/first/matched/file.js',
                '/my/second/matched/file.js'
            ]);

            this.config.phpToJS = {
                include: [
                    'my/first/**/*.php',
                    'my/second/**/*.php'
                ]
            };

            expect(this.callTransform()).to.equal(expectedJS);
        });

        it('should pass phpToJS options through to phpToJS', function () {
            this.config.phpToJS = {myOption: 123};

            this.callTransform();

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({myOption: 123})
            );
        });

        it('should pass the dirname of the resolved PHPRuntime lib through to PHPToJS', function () {
            this.resolveRequire.withArgs('phpruntime').returns('/path/to/the/runtime/index.js');
            this.config.phpToJS = {myOption: 123};

            this.callTransform();

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({runtimePath: '/path/to/the/runtime'})
            );
        });
    });

    describe('for non-entry files', function () {
        it('should include a require of the entry module and then this non-entry module factory', function () {
            var expectedJS = nowdoc(function () {/*<<<EOS
require("/path/to/my/file.js");
module.exports = require("/path/to/node_modules/phpify/api").load("../../my/second/file.js", (function () { return "transpiler result"; }()));
EOS*/;}); // jshint ignore:line

            this.globby.sync.withArgs([
                '/path/to/the/configdir/my/first/**/*.php',
                '/path/to/the/configdir/my/second/**/*.php'
            ]).returns([
                '/my/first/matched/file.js',
                '/my/second/matched/file.js'
            ]);

            this.config.phpToJS = {
                include: [
                    'my/first/**/*.php',
                    'my/second/**/*.php'
                ]
            };

            this.callTransform('/path/to/my/file.js'); // Initial entry file transform

            expect(this.callTransform('/path/to/my/second/file.js')).to.equal(expectedJS);
        });

        it('should pass phpToJS options through to phpToJS', function () {
            this.config.phpToJS = {myOption: 123};
            this.callTransform('/path/to/my/file.js'); // Initial entry file transform

            this.callTransform('/path/to/my/second/file.js');

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({myOption: 123})
            );
        });

        it('should pass the dirname of the resolved PHPRuntime lib through to PHPToJS', function () {
            this.resolveRequire.withArgs('phpruntime').returns('/path/to/the/runtime/index.js');
            this.config.phpToJS = {myOption: 123};
            this.callTransform('/path/to/my/file.js'); // Initial entry file transform

            this.callTransform('/path/to/my/second/file.js');

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({runtimePath: '/path/to/the/runtime'})
            );
        });
    });
});
