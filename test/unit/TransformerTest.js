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
    var globby,
        initialiserStubPath,
        parserState,
        phpCoreConfig,
        phpifyConfig,
        phpParser,
        phpToJS,
        phpToJSConfig,
        phpToJSResult,
        resolveRequire,
        transformer,
        transpilerConfig;

    beforeEach(function () {
        globby = {
            sync: sinon.stub().returns([])
        };
        initialiserStubPath = '/my/path/to/my/initialiser_stub.php';
        parserState = {
            setPath: sinon.stub()
        };
        phpCoreConfig = {
            topLevelConfig: {
                my: 'top level config'
            },
            pluginConfigFilePaths: ['/my/first_plugin', '/my/second_plugin']
        };
        phpifyConfig = {
            include: ['**/*.php']
        };
        phpParser = {
            getState: sinon.stub().returns(parserState),
            parse: sinon.stub()
        };
        phpToJS = {
            transpile: sinon.stub()
        };
        phpToJSConfig = {};
        phpToJSResult = {
            code: '(function () { return "my transpiled JS code"; }())',
            map: {}
        };
        transpilerConfig = {
            transpilerRule1: 'value 1',
            transpilerRule2: 'value 2'
        };
        resolveRequire = sinon.stub();

        phpToJS.transpile.returns(phpToJSResult);
        resolveRequire.withArgs('phpify').returns('/my/path/to/node_modules/phpify/api');
        resolveRequire.withArgs('phpruntime').returns('/my/path/to/node_modules/phpruntime/index.js');

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
            '/my/context/dir'
        );
    });

    describe('for the initialiser stub file', function () {
        beforeEach(function () {
            phpifyConfig.include = [
                'my/first/**/*.php',
                'my/second/**/*.php',
                '!my/third/**/*.php'
            ];

            globby.sync.withArgs([
                '/my/context/dir/my/first/**/*.php',
                '/my/context/dir/my/second/**/*.php',
                '!/my/context/dir/my/third/**/*.php'
            ]).returns([
                '/my/first/matched/file.php',
                '/my/second/matched/file.php'
            ]);
        });

        it('should return the initialiser code, including the virtual FS switch, when no bootstraps are defined', function () {
            var result = transformer.transform('<?php my code here;', initialiserStubPath);

            expect(result).to.deep.equal({
                code: nowdoc(function () {/*<<<EOS
module.exports = function (loader) {
    loader.installModules(function (path, checkExistence) {
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
            // reach the return after the end of the switch.
            return null;
        }

        switch (path) {
        case handlePath("../../first/matched/file.php"): return require("./../../../first/matched/file.php");
        case handlePath("../../second/matched/file.php"): return require("./../../../second/matched/file.php");
        }

        return checkExistence ? exists : null;
    })
    .configure({"stdio":true}, [require("/my/first_plugin"), require("/my/second_plugin"), {"my":"top level config"}]);
};
EOS*/;}), // jshint ignore:line
                map: null
            });
        });

        it('should return the initialiser code, including the virtual FS switch, when two bootstraps are defined', function () {
            phpifyConfig.bootstraps = [
                './my/path/to/bootstrap_one.php',
                'the/bootstrap_two.php'
            ];

            var result = transformer.transform('<?php my code here;', initialiserStubPath);

            expect(result).to.deep.equal({
                code: nowdoc(function () {/*<<<EOS
module.exports = function (loader) {
    loader.installModules(function (path, checkExistence) {
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
            // reach the return after the end of the switch.
            return null;
        }

        switch (path) {
        case handlePath("../../first/matched/file.php"): return require("./../../../first/matched/file.php");
        case handlePath("../../second/matched/file.php"): return require("./../../../second/matched/file.php");
        }

        return checkExistence ? exists : null;
    })
    .configure({"stdio":true}, [require("/my/first_plugin"), require("/my/second_plugin"), {"my":"top level config"}])
    .bootstrap(function () { return [require("./../../../context/dir/my/path/to/bootstrap_one.php"), require("./../../../context/dir/the/bootstrap_two.php")]; });
};
EOS*/;}), // jshint ignore:line
                map: null
            });
        });

        it('should include the stubFiles call when stubFiles are defined', function () {
            phpifyConfig.stubFiles = {
                'my/stub.php': '<?php echo "stubbed content"; ?>'
            };

            var result = transformer.transform('<?php my code here;', initialiserStubPath);

            expect(result).to.deep.equal({
                code: nowdoc(function () {/*<<<EOS
module.exports = function (loader) {
    loader.installModules(function (path, checkExistence) {
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
            // reach the return after the end of the switch.
            return null;
        }

        switch (path) {
        case handlePath("../../first/matched/file.php"): return require("./../../../first/matched/file.php");
        case handlePath("../../second/matched/file.php"): return require("./../../../second/matched/file.php");
        }

        return checkExistence ? exists : null;
    })
    .configure({"stdio":true}, [require("/my/first_plugin"), require("/my/second_plugin"), {"my":"top level config"}])
    .stubFiles({"my/stub.php":"<?php echo \"stubbed content\"; ?>"});
};
EOS*/;}), // jshint ignore:line
                map: null
            });
        });
    });

    describe('for normal files that aren\'t the initialiser stub', function () {
        it('should return the result from the transpiler', function () {
            phpParser.parse
                .withArgs('<?php print 1001;')
                .returns({my: 'AST'});
            phpToJS.transpile
                .withArgs({my: 'AST'})
                .returns('(function () { return "transpiler result"; }());');

            expect(transformer.transform('<?php print 1001;', '/path/to/my/file.php'))
                .to.equal('(function () { return "transpiler result"; }());');
        });

        it('should pass PHPToJS options through to PHPToJS', function () {
            phpToJSConfig.myOption = 'my value 1';
            phpToJSConfig.myOtherOption = 'my value 2';

            transformer.transform('<?php my code here;', '/my/context/dir/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            expect(phpToJS.transpile.args[0][1]).to.include({
                myOption: 'my value 1',
                myOtherOption: 'my value 2'
            });
        });

        it('should pass the path to the current file relative to the config dir through to PHPToJS', function () {
            transformer.transform('<?php my code here;', '/my/path/to/my/module.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            expect(phpToJS.transpile.args[0][1]).to.include({
                path: '../../path/to/my/module.php'
            });
        });

        it('should pass the dirname of the resolved PHPRuntime lib through to PHPToJS', function () {
            transformer.transform('<?php my code here;', '/my/context/dir/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            expect(phpToJS.transpile.args[0][1]).to.include({
                runtimePath: '/my/path/to/node_modules/phpruntime'
            });
        });

        it('should pass the prefix with a require of this normal module factory', function () {
            transformer.transform('<?php my code here;', '/my/context/dir/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            // We need to pass the prefix and suffix code through to PHPToJS separately
            // so that it can calculate the source map line numbers correctly.
            expect(phpToJS.transpile.args[0][1]).to.include({
                prefix: 'require("/my/path/to/node_modules/phpify/api").load("my/second/file.php", module, '
            });
        });

        it('should pass the suffix through to PHPToJS', function () {
            transformer.transform('<?php my code here;', '/my/context/dir/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            expect(phpToJS.transpile.args[0][1]).to.include({
                suffix: ');'
            });
        });

        it('should pass the source content for the source map through to PHPToJS', function () {
            transformer.transform('<?php $my = "source";', '/my/context/dir/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            expect(phpToJS.transpile.args[0][1].sourceMap).to.include({
                sourceContent: '<?php $my = "source";'
            });
        });

        it('should specify to PHPToJS that the raw source map object should be returned', function () {
            transformer.transform('<?php $my = "source";', '/my/context/dir/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            expect(phpToJS.transpile.args[0][1].sourceMap).to.include({
                returnMap: true
            });
        });

        it('should pass Transpiler options through to PHPToJS', function () {
            transformer.transform('<?php my code here;', '/my/context/dir/my/second/file.php');

            expect(phpToJS.transpile).to.have.been.calledOnce;
            expect(phpToJS.transpile.args[0][2]).to.equal(transpilerConfig);
        });

        describe('when stubbed', function () {
            beforeEach(function () {
                phpifyConfig.stub = {
                    // The key in the stub map is relative to the context directory.
                    '../../stubbed_file.php': null
                };
            });

            it('should pass a string value through as the PHP source', function () {
                phpifyConfig.stub['../../stubbed_file.php'] = '<?php return 21;';

                transformer.transform('<?php initial code;', '/my/stubbed_file.php');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse.args[0][0]).to.equal('<?php return 21;');
            });

            it('should pass a primitive boolean value through as code to return it', function () {
                phpifyConfig.stub['../../stubbed_file.php'] = true;

                transformer.transform('<?php initial code;', '/my/stubbed_file.php');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse.args[0][0]).to.equal('<?php return true;');
            });

            it('should pass a primitive number value through as code to return it', function () {
                phpifyConfig.stub['../../stubbed_file.php'] = 23457;

                transformer.transform('<?php initial code;', '/my/stubbed_file.php');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse.args[0][0]).to.equal('<?php return 23457;');
            });

            it('should pass null through as code to return it', function () {
                phpifyConfig.stub['../../stubbed_file.php'] = null;

                transformer.transform('<?php initial code;', '/my/stubbed_file.php');

                expect(phpParser.parse).to.have.been.calledOnce;
                expect(phpParser.parse.args[0][0]).to.equal('<?php return null;');
            });

            it('should throw if an invalid stub value type is given', function () {
                phpifyConfig.stub['../../stubbed_file.php'] = {};

                expect(function () {
                    transformer.transform('<?php initial code;', '/my/stubbed_file.php');
                }).to.throw('Unsupported stub type "object" for file "../../stubbed_file.php"');
            });
        });
    });
});
