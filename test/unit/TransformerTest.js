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

        this.callTransform = function (file, configDir, content) {
            return this.transformer.transform(
                this.config,
                content || '',
                file || '/path/to/my/file.js',
                configDir || '/path/to/the/configdir'
            );
        }.bind(this);
    });

    describe('for the entry file', function () {
        beforeEach(function () {
            this.config.phpToJS = {
                include: [
                    'my/first/**/*.php',
                    'my/second/**/*.php'
                ]
            };

            this.globby.sync.withArgs([
                '/path/to/the/configdir/my/first/**/*.php',
                '/path/to/the/configdir/my/second/**/*.php'
            ]).returns([
                '/my/first/matched/file.js',
                '/my/second/matched/file.js'
            ]);
        });

        it('should return the result from the transpiler', function () {
            expect(this.callTransform()).to.equal('(function () { return "transpiler result"; }())');
        });

        it('should pass phpToJS options through to phpToJS', function () {
            this.config.phpToJS.myOption = 123;

            this.callTransform();

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({myOption: 123})
            );
        });

        it('should pass the path to the current file relative to the config dir through to PHPToJS', function () {
            this.callTransform('/the/path/to/my/module.php', '/the/path/goes/here/to/config');

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({path: '../../../../to/my/module.php'})
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

        it('should pass the prefix with PHP module factory fetcher and entry module factory through to PHPToJS', function () {
            var expectedPrefixJS = nowdoc(function () {/*<<<EOS
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
module.exports = require("/path/to/node_modules/phpify/api").load("../../my/file.js",
EOS*/;}) + ' '; // jshint ignore:line

            this.callTransform();

            // We need to pass the prefix and suffix code through to PHPToJS separately
            // so that it can calculate the source map line numbers correctly
            expect(this.phpToJS.transpile.args[0][1]).to.have.property('prefix');
            expect(this.phpToJS.transpile.args[0][1].prefix).to.equal(expectedPrefixJS);
        });

        it('should pass the suffix through to PHPToJS', function () {
            this.callTransform();

            expect(this.phpToJS.transpile.args[0][1]).to.have.property('suffix');
            expect(this.phpToJS.transpile.args[0][1].suffix).to.equal(');');
        });

        it('should pass the source content for the source map through to PHPToJS', function () {
            this.callTransform(null, null, '<?php $my = "source";');

            expect(this.phpToJS.transpile.args[0][1].sourceMap).to.have.property('sourceContent');
            expect(this.phpToJS.transpile.args[0][1].sourceMap.sourceContent).to.equal('<?php $my = "source";');
        });
    });

    describe('for non-entry files', function () {
        beforeEach(function () {
            this.config.phpToJS = {
                include: [
                    'my/first/**/*.php',
                    'my/second/**/*.php'
                ]
            };

            this.globby.sync.withArgs([
                '/path/to/the/configdir/my/first/**/*.php',
                '/path/to/the/configdir/my/second/**/*.php'
            ]).returns([
                '/my/first/matched/file.js',
                '/my/second/matched/file.js'
            ]);

            this.transformInitialEntryFile = function () {
                this.callTransform('/path/to/my/file.js'); // Initial entry file transform

                this.phpToJS.transpile.reset();
            }.bind(this);
        });

        it('should return the result from the transpiler', function () {
            this.transformInitialEntryFile();

            expect(this.callTransform()).to.equal('(function () { return "transpiler result"; }())');
        });

        it('should pass phpToJS options through to phpToJS', function () {
            this.config.phpToJS = {myOption: 123};
            this.transformInitialEntryFile();

            this.callTransform('/path/to/my/second/file.js');

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({myOption: 123})
            );
        });

        it('should pass the path to the current file relative to the config dir through to PHPToJS', function () {
            this.transformInitialEntryFile();

            this.callTransform('/the/path/to/my/module.php', '/the/path/goes/here/to/config');

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({path: '../../../../to/my/module.php'})
            );
        });

        it('should pass the dirname of the resolved PHPRuntime lib through to PHPToJS', function () {
            this.resolveRequire.withArgs('phpruntime').returns('/path/to/the/runtime/index.js');
            this.config.phpToJS = {myOption: 123};
            this.transformInitialEntryFile();

            this.callTransform('/path/to/my/second/file.js');

            expect(this.phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({runtimePath: '/path/to/the/runtime'})
            );
        });

        it('should pass the prefix with a require of the entry module and then this non-entry module factory', function () {
            var expectedPrefixJS = nowdoc(function () {/*<<<EOS
require("/path/to/my/file.js");
module.exports = require("/path/to/node_modules/phpify/api").load("../../my/second/file.js",
EOS*/;}) + ' '; // jshint ignore:line
            this.transformInitialEntryFile();

            this.callTransform('/path/to/my/second/file.js');

            // We need to pass the prefix and suffix code through to PHPToJS separately
            // so that it can calculate the source map line numbers correctly
            expect(this.phpToJS.transpile.args[0][1]).to.have.property('prefix');
            expect(this.phpToJS.transpile.args[0][1].prefix).to.equal(expectedPrefixJS);
        });

        it('should pass the suffix through to PHPToJS', function () {
            this.transformInitialEntryFile();

            this.callTransform('/path/to/my/second/file.js');

            expect(this.phpToJS.transpile.args[0][1]).to.have.property('suffix');
            expect(this.phpToJS.transpile.args[0][1].suffix).to.equal(');');
        });

        it('should pass the source content for the source map through to PHPToJS', function () {
            this.transformInitialEntryFile();

            this.callTransform('/path/to/my/second/file.js', null, '<?php $my = "source";');

            expect(this.phpToJS.transpile.args[0][1].sourceMap).to.have.property('sourceContent');
            expect(this.phpToJS.transpile.args[0][1].sourceMap.sourceContent).to.equal('<?php $my = "source";');
        });
    });
});
