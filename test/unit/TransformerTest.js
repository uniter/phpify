/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
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
    var callTransform,
        config,
        contextDirectory,
        globby,
        parserState,
        phpCoreConfig,
        phpifyConfig,
        phpParser,
        phpToJS,
        phpToJSConfig,
        resolveRequire,
        transformer,
        transpilerConfig,
        initialiserStubPath;

    beforeEach(function () {
        config = {};
        contextDirectory = '/path/to/the/contextdir';
        globby = {
            sync: sinon.stub().returns([])
        };
        parserState = {
            setPath: sinon.stub()
        };
        phpCoreConfig = {
            topLevelConfig: {
                my: 'top level config'
            },
            pluginConfigFilePaths: ['/my/first_plugin', '/my/second_plugin']
        };
        phpifyConfig = {};
        phpParser = {
            getState: sinon.stub().returns(parserState),
            parse: sinon.stub()
        };
        phpToJS = {
            transpile: sinon.stub().returns('(function () { return "transpiler result"; }());')
        };
        phpToJSConfig = {};
        transpilerConfig = {};
        resolveRequire = sinon.stub();
        initialiserStubPath = '/path/to/my/initialiser_stub.php';
        transformer = new Transformer(
            phpParser,
            phpToJS,
            resolveRequire,
            globby,
            initialiserStubPath,
            phpifyConfig,
            phpToJSConfig,
            transpilerConfig,
            phpCoreConfig,
            contextDirectory
        );

        resolveRequire.withArgs('phpify').returns('/path/to/node_modules/phpify/index.js');
        resolveRequire.withArgs('phpruntime').returns('/path/to/node_modules/phpruntime/index.js');

        callTransform = function (file, content) {
            return transformer.transform(content || '', file || '/path/to/my/file.php');
        };
    });

    describe('for the initialiser stub file', function () {
        beforeEach(function () {
            phpifyConfig.include = [
                'my/first/**/*.php',
                'my/second/**/*.php',
                '!my/third/**/*.php'
            ];

            globby.sync.withArgs([
                '/path/to/the/contextdir/my/first/**/*.php',
                '/path/to/the/contextdir/my/second/**/*.php',
                '!/path/to/the/contextdir/my/third/**/*.php'
            ]).returns([
                '/my/first/matched/file.php',
                '/my/second/matched/file.php'
            ]);

            callTransform = callTransform.bind(null, initialiserStubPath);
        });

        it('should return the initialiser code, including the virtual FS switch, when no bootstraps are defined', function () {
            var expectedVfsSwitchCode = nowdoc(function () {/*<<<EOS
require("/path/to/node_modules/phpify/api").installModules(function (path, checkExistence) {
    var exists = false;

    function handlePath(aPath) {
        if (!checkExistence) {
            return aPath;
        }

        if (aPath === path) {
            exists = true;
        }

        // Return something that should not match with the path variable,
        // so that the case itself is not executed and we eventually
        // reach the return after the end of the switch
        return null;
    }

    switch (path) {
    case handlePath("../../../../my/first/matched/file.php"): return require("./../../../my/first/matched/file.php");
    case handlePath("../../../../my/second/matched/file.php"): return require("./../../../my/second/matched/file.php");
    }

    return checkExistence ? exists : null;
})
.configure({"stdio":true}, [require("/my/first_plugin"), require("/my/second_plugin"), {"my":"top level config"}]);
EOS
*/;}); // jshint ignore:line

            expect(callTransform()).to.deep.equal({
                code: expectedVfsSwitchCode,
                map: null
            });
        });

        it('should return the initialiser code, including the virtual FS switch, when two bootstraps are defined', function () {
            var expectedVfsSwitchCode = nowdoc(function () {/*<<<EOS
require("/path/to/node_modules/phpify/api").installModules(function (path, checkExistence) {
    var exists = false;

    function handlePath(aPath) {
        if (!checkExistence) {
            return aPath;
        }

        if (aPath === path) {
            exists = true;
        }

        // Return something that should not match with the path variable,
        // so that the case itself is not executed and we eventually
        // reach the return after the end of the switch
        return null;
    }

    switch (path) {
    case handlePath("../../../../my/first/matched/file.php"): return require("./../../../my/first/matched/file.php");
    case handlePath("../../../../my/second/matched/file.php"): return require("./../../../my/second/matched/file.php");
    }

    return checkExistence ? exists : null;
})
.configure({"stdio":true}, [require("/my/first_plugin"), require("/my/second_plugin"), {"my":"top level config"}])
.bootstrap([require("./../../../my/path/to/bootstrap_one"), require("./../the/bootstrap_two")]);
EOS
*/;}); // jshint ignore:line

            phpifyConfig.bootstraps = [
                '/my/path/to/bootstrap_one',
                '/path/to/the/bootstrap_two'
            ];

            expect(callTransform()).to.deep.equal({
                code: expectedVfsSwitchCode,
                map: null
            });
        });
    });

    describe('for normal files that aren\'t the initialiser stub', function () {
        beforeEach(function () {
            phpifyConfig.include = [
                'my/first/**/*.php',
                'my/second/**/*.php'
            ];

            globby.sync.withArgs([
                '/path/to/the/contextdir/my/first/**/*.php',
                '/path/to/the/contextdir/my/second/**/*.php'
            ]).returns([
                '/my/first/matched/file.php',
                '/my/second/matched/file.php'
            ]);
        });

        it('should return the result from the transpiler', function () {
            phpParser.parse
                .withArgs('<?php print 1001;')
                .returns({my: 'AST'});
            phpToJS.transpile
                .withArgs({my: 'AST'})
                .returns('(function () { return "transpiler result"; }());');

            expect(callTransform('/path/to/my/file.php', '<?php print 1001;'))
                .to.equal('(function () { return "transpiler result"; }());');
        });

        it('should pass PHPToJS options through to PHPToJS', function () {
            phpToJSConfig.myOption = 123;

            callTransform('/path/to/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({myOption: 123})
            );
        });

        it('should pass the path to the current file relative to the config dir through to PHPToJS', function () {
            contextDirectory = '/the/path/goes/here/to/config';

            callTransform('/the/path/to/my/module.php');

            expect(phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({path: '../../../../the/path/to/my/module.php'})
            );
        });

        it('should pass the dirname of the resolved PHPRuntime lib through to PHPToJS', function () {
            resolveRequire.withArgs('phpruntime').returns('/path/to/the/runtime/index.js');
            config.phpToJS = {myOption: 123};

            callTransform('/path/to/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match({runtimePath: '/path/to/the/runtime'})
            );
        });

        it('should pass the prefix with a require of the initialiser stub module and then this normal module factory', function () {
            var expectedPrefixJS = nowdoc(function () {/*<<<EOS
require("/path/to/my/initialiser_stub.php");
require("/path/to/node_modules/phpify/api").load("../../my/second/file.php", module,
EOS*/;}) + ' '; // jshint ignore:line

            callTransform('/path/to/my/second/file.php');

            // We need to pass the prefix and suffix code through to PHPToJS separately
            // so that it can calculate the source map line numbers correctly
            expect(phpToJS.transpile.args[0][1]).to.have.property('prefix');
            expect(phpToJS.transpile.args[0][1].prefix).to.equal(expectedPrefixJS);
        });

        it('should pass the suffix through to PHPToJS', function () {
            callTransform('/path/to/my/second/file.php');

            expect(phpToJS.transpile.args[0][1]).to.have.property('suffix');
            expect(phpToJS.transpile.args[0][1].suffix).to.equal(');');
        });

        it('should pass the source content for the source map through to PHPToJS', function () {
            callTransform('/path/to/my/second/file.php', '<?php $my = "source";');

            expect(phpToJS.transpile.args[0][1].sourceMap).to.have.property('sourceContent');
            expect(phpToJS.transpile.args[0][1].sourceMap.sourceContent).to.equal('<?php $my = "source";');
        });

        it('should specify to PHPToJS that the raw source map object should be returned', function () {
            callTransform('/path/to/my/second/file.php', '<?php $my = "source";');

            expect(phpToJS.transpile.args[0][1].sourceMap).to.have.property('returnMap');
            expect(phpToJS.transpile.args[0][1].sourceMap.returnMap).to.be.true;
        });

        it('should pass Transpiler options through to PHPToJS', function () {
            transpilerConfig.myExtraOption = 21;

            callTransform('/path/to/my/second/file.php', '<?php $my = "source";');

            expect(phpToJS.transpile).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match({
                    myExtraOption: 21
                })
            );
        });

        describe('when stubbed', function () {
            it('should pass a string value through as the PHP source', function () {
                phpifyConfig.stub = {
                    '../../my/stubbed_file.php': '<?php print 21;'
                };

                callTransform('/path/to/my/stubbed_file.php', '<?php $my = "source";');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse).to.have.been.calledWith('<?php print 21;');
            });

            it('should pass a primitive boolean value through as code to return it', function () {
                phpifyConfig.stub = {
                    '../../my/stubbed_file.php': true
                };

                callTransform('/path/to/my/stubbed_file.php', '<?php $my = "source";');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse).to.have.been.calledWith('<?php return true;');
            });

            it('should pass a primitive number value through as code to return it', function () {
                phpifyConfig.stub = {
                    '../../my/stubbed_file.php': 23457
                };

                callTransform('/path/to/my/stubbed_file.php', '<?php $my = "source";');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse).to.have.been.calledWith('<?php return 23457;');
            });

            it('should pass null through as code to return it', function () {
                phpifyConfig.stub = {
                    '../../my/stubbed_file.php': null
                };

                callTransform('/path/to/my/stubbed_file.php', '<?php $my = "source";');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse).to.have.been.calledWith('<?php return null;');
            });

            it('should throw if an invalid stub value type is given', function () {
                phpifyConfig.stub = {
                    '../../my/stubbed_file.php': {iAm: 'invalid'}
                };

                expect(function () {
                    callTransform('/path/to/my/stubbed_file.php', '<?php $my = "source";');
                }).to.throw('Unsupported stub type "object" for file "../../my/stubbed_file.php"');
            });
        });
    });
});
