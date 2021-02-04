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
    EnvironmentProvider = require('../../src/EnvironmentProvider'),
    FileSystem = require('../../src/FileSystem'),
    Loader = require('../../src/Loader'),
    ModuleRepository = require('../../src/ModuleRepository');

describe('Loader', function () {
    var environment,
        environmentProvider,
        fileSystem,
        loader,
        moduleRepository,
        phpConfigImporter;

    beforeEach(function () {
        environment = {};
        environmentProvider = sinon.createStubInstance(EnvironmentProvider);
        fileSystem = sinon.createStubInstance(FileSystem);
        moduleRepository = sinon.createStubInstance(ModuleRepository);
        phpConfigImporter = {
            importLibrary: sinon.stub().returns({
                mergeAll: sinon.stub()
            })
        };

        environmentProvider.createEnvironment.returns(environment);

        loader = new Loader(moduleRepository, fileSystem, environmentProvider, phpConfigImporter);
    });

    describe('bootstrap()', function () {
        it('should call any functions returned by bootstrap modules with the Environment', function () {
            var bootstrapResult1 = sinon.stub(),
                bootstrapResult2 = sinon.stub();

            loader.bootstrap([
                21, // Simulate a bootstrap module returning a non-function
                bootstrapResult1,
                bootstrapResult2
            ]);

            expect(bootstrapResult1).to.have.been.calledOnce;
            expect(bootstrapResult1).to.have.been.calledWith(sinon.match.same(environment));
            expect(bootstrapResult2).to.have.been.calledOnce;
            expect(bootstrapResult2).to.have.been.calledWith(sinon.match.same(environment));
        });

        it('should return the Loader for chaining', function () {
            expect(loader.bootstrap([])).to.equal(loader);
        });
    });

    describe('configure()', function () {
        it('should import the PHPCore library config correctly', function () {
            var config1 = {},
                config2 = {};

            loader.configure({}, [config1, config2]);

            expect(phpConfigImporter.importLibrary).to.have.been.calledOnce;
            expect(phpConfigImporter.importLibrary).to.have.been.calledWith(
                {configs: [config1, config2]}
            );
        });

        it('should return the Loader for chaining', function () {
            expect(loader.configure({}, [])).to.equal(loader);
        });
    });

    describe('getEnvironment()', function () {
        it('should pass the FileSystem to the EnvironmentProvider', function () {
            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.same(fileSystem)
            );
        });

        it('should pass the PHPify config that was passed to .configure()', function () {
            loader.configure({my: 'PHPify config'});

            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                {my: 'PHPify config'}
            );
        });

        it('should pass the PHPCore config that was passed to .configure()', function () {
            phpConfigImporter.importLibrary.returns({
                mergeAll: sinon.stub().returns({my: 'PHPCore config'})
            });
            loader.configure({}, [{first: 'PHPCore config 1'}, {second: 'PHPCore config 2'}]);

            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                {my: 'PHPCore config'}
            );
        });
    });

    describe('getModuleFactory()', function () {
        it('should return the module factory from the ModuleRepository', function () {
            var moduleFactory = sinon.stub();
            moduleRepository.getModuleFactory
                .withArgs('/my/php/file/path.php')
                .returns(moduleFactory);

            expect(loader.getModuleFactory('/my/php/file/path.php')).to.equal(moduleFactory);
        });
    });

    describe('installModules()', function () {
        var moduleFactoryFetcher;

        beforeEach(function () {
            moduleFactoryFetcher = sinon.stub();
        });

        it('should initialize the ModuleRepository', function () {
            loader.installModules(moduleFactoryFetcher);

            expect(moduleRepository.init).to.have.been.calledOnce;
        });

        it('should pass the module factory fetcher through to the ModuleRepository', function () {
            loader.installModules(moduleFactoryFetcher);

            expect(moduleRepository.init).to.have.been.calledWith(sinon.match.same(moduleFactoryFetcher));
        });

        it('should return the Loader for chaining', function () {
            expect(loader.installModules(moduleFactoryFetcher)).to.equal(loader);
        });
    });

    describe('isInitialised()', function () {
        it('should return false initially', function () {
            expect(loader.isInitialised()).to.be.false;
        });

        it('should return true after the Environment has been created', function () {
            loader.getEnvironment();

            expect(loader.isInitialised()).to.be.true;
        });
    });

    describe('load()', function () {
        it('should load the module factory via the ModuleRepository correctly', function () {
            var module = {exports: null, id: 'my-module'},
                moduleFactory = sinon.stub();
            moduleRepository.load.returns(moduleFactory);

            loader.load('my/module/path.php', module, moduleFactory);

            expect(moduleRepository.load).to.have.been.calledOnce;
            expect(moduleRepository.load).to.have.been.calledWith(
                'my/module/path.php',
                'my-module',
                sinon.match.same(moduleFactory),
                sinon.match.same(environment)
            );
        });

        it('should export the ModuleRepository result from the module', function () {
            var module = {exports: null, id: 'my-module'},
                moduleFactory = sinon.stub();
            moduleRepository.load.returns(moduleFactory);

            loader.load('my/module/path.php', module, moduleFactory);

            expect(module.exports).to.equal(moduleFactory);
        });
    });
});
