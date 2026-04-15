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
    sinon = require('sinon'),
    RealTransformer = require('../../src/Transformer'),
    TransformerFactory = require('../../src/TransformerFactory');

describe('TransformerFactory', function () {
    var Transformer,
        globby,
        initialiserStubPath,
        phpCoreConfig,
        phpConfigLoader,
        phpifyConfig,
        phpParser,
        phpToAST,
        phpToJS,
        phpToJSConfig,
        resolveRequire,
        transformer,
        transformerFactory,
        transpilerConfig,
        uniterConfig;

    beforeEach(function () {
        globby = {};
        initialiserStubPath = '/my/path/to/initialiser_stub.php';
        phpCoreConfig = {my: 'phpcore config'};
        phpifyConfig = {};
        phpParser = {};
        phpToJSConfig = {};
        resolveRequire = sinon.stub();
        transformer = sinon.createStubInstance(RealTransformer);
        transpilerConfig = {};

        Transformer = sinon.stub().returns(transformer);

        uniterConfig = {
            exportLibrary: sinon.stub(),
            getConfigsForLibrary: sinon.stub()
        };

        uniterConfig.exportLibrary.withArgs('phpcore').returns(phpCoreConfig);
        uniterConfig.getConfigsForLibrary.withArgs('phpify').returns({
            mergeUniqueObjects: sinon.stub().returns(phpifyConfig)
        });
        uniterConfig.getConfigsForLibrary.withArgs('phpify', 'phptoast').returns({
            mergeUniqueObjects: sinon.stub().returns({})
        });
        uniterConfig.getConfigsForLibrary.withArgs('phpify', 'phptojs').returns({
            mergeUniqueObjects: sinon.stub().returns(phpToJSConfig)
        });
        uniterConfig.getConfigsForLibrary.withArgs('phpify', 'transpiler').returns({
            mergeUniqueObjects: sinon.stub().returns(transpilerConfig)
        });

        phpToAST = {
            create: sinon.stub().returns(phpParser)
        };
        phpToJS = {};

        phpConfigLoader = {
            getConfig: sinon.stub().returns(uniterConfig)
        };

        transformerFactory = new TransformerFactory(
            Transformer,
            phpConfigLoader,
            phpToAST,
            phpToJS,
            resolveRequire,
            globby,
            initialiserStubPath
        );
    });

    describe('create()', function () {
        it('should return an instance of Transformer', function () {
            var result = transformerFactory.create('/my/context/dir');

            expect(result).to.equal(transformer);
        });

        it('should create a Transformer with the context directory when phpifyConfig.rootDir is not set', function () {
            transformerFactory.create('/my/context/dir');

            expect(Transformer).to.have.been.calledOnce;
            expect(Transformer.args[0][9]).to.equal('/my/context/dir');
        });

        it('should create a Transformer with phpifyConfig.rootDir when it is set', function () {
            phpifyConfig.rootDir = '/my/overridden/root/dir';

            transformerFactory.create('/my/context/dir');

            expect(Transformer).to.have.been.calledOnce;
            expect(Transformer.args[0][9]).to.equal('/my/overridden/root/dir');
        });

        it('should create a Transformer with the context directory when phpifyConfig.rootDir is falsy', function () {
            phpifyConfig.rootDir = '';

            transformerFactory.create('/my/context/dir');

            expect(Transformer).to.have.been.calledOnce;
            expect(Transformer.args[0][9]).to.equal('/my/context/dir');
        });

        it('should load the config using the context directory', function () {
            transformerFactory.create('/my/context/dir');

            expect(phpConfigLoader.getConfig).to.have.been.calledOnce;
            expect(phpConfigLoader.getConfig).to.have.been.calledWith(['/my/context/dir']);
        });

        it('should pass the phpifyConfig through to the Transformer', function () {
            transformerFactory.create('/my/context/dir');

            expect(Transformer).to.have.been.calledOnce;
            expect(Transformer.args[0][5]).to.equal(phpifyConfig);
        });

        it('should pass the phpCoreConfig through to the Transformer', function () {
            transformerFactory.create('/my/context/dir');

            expect(Transformer).to.have.been.calledOnce;
            expect(Transformer.args[0][8]).to.equal(phpCoreConfig);
        });
    });
});
