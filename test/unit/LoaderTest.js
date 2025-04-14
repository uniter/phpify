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
    Environment = require('../../src/Environment/Environment'),
    EnvironmentProvider = require('../../src/Environment/EnvironmentProvider'),
    FileSystem = require('../../src/FileSystem'),
    InitialiserContext = require('../../src/Initialiser/InitialiserContext'),
    InitialiserLoader = require('../../src/Initialiser/InitialiserLoader'),
    Loader = require('../../src/Loader'),
    ModuleRepository = require('../../src/ModuleRepository');

describe('Loader', function () {
    var environment,
        environmentProvider,
        fileSystem,
        initialiser,
        initialiserContext,
        initialiserLoader,
        loader,
        mergeAllResult,
        moduleRepository,
        phpConfigImporter;

    beforeEach(function () {
        environment = sinon.createStubInstance(Environment);
        environmentProvider = sinon.createStubInstance(EnvironmentProvider);
        fileSystem = sinon.createStubInstance(FileSystem);
        initialiser = sinon.stub();
        initialiserContext = sinon.createStubInstance(InitialiserContext);
        initialiserLoader = sinon.createStubInstance(InitialiserLoader);
        mergeAllResult = {
            my: 'PHPCore config',
            addons: ['base-addon']
        };
        moduleRepository = sinon.createStubInstance(ModuleRepository);
        phpConfigImporter = {
            importLibrary: sinon.stub().returns({
                mergeAll: sinon.stub().returns(mergeAllResult)
            })
        };

        environment.requireModule.returns('my module execution result');
        environmentProvider.createEnvironment.returns(environment);
        initialiserLoader.loadInitialiser.returns(initialiser);

        loader = new Loader(
            moduleRepository,
            initialiserContext,
            fileSystem,
            environmentProvider,
            phpConfigImporter
        );
    });

    describe('bootstrap()', function () {
        it('should register the bootstrap fetcher with the InitialiserContext', function () {
            var bootstrapFetcher = sinon.stub();

            loader.bootstrap(bootstrapFetcher);

            expect(initialiserContext.bootstrap).to.have.been.calledOnce;
            expect(initialiserContext.bootstrap).to.have.been.calledWith(sinon.match.same(bootstrapFetcher));
        });

        it('should return the Loader for chaining', function () {
            expect(loader.bootstrap(sinon.stub())).to.equal(loader);
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

    describe('createEnvironment()', function () {
        it('should pass the ModuleRepository to the EnvironmentProvider', function () {
            loader.createEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.same(moduleRepository)
            );
        });

        it('should pass the InitialiserContext to the EnvironmentProvider', function () {
            loader.createEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.same(initialiserContext)
            );
        });

        it('should pass the FileSystem to the EnvironmentProvider', function () {
            loader.createEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.same(fileSystem)
            );
        });

        it('should pass the PHPify config that was passed to .configure()', function () {
            loader.configure({my: 'PHPify config'});

            loader.createEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                {my: 'PHPify config'}
            );
        });

        it('should pass the PHPCore config that was passed to .configure()', function () {
            loader.configure({}, [{first: 'PHPCore config 1'}, {second: 'PHPCore config 2'}]);

            loader.createEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match({
                    my: 'PHPCore config'
                })
            );
        });

        it('should merge additional PHPify config when provided', function () {
            loader.configure({base: 'config'});

            loader.createEnvironment(null, {additional: 'config'});

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match({
                    base: 'config',
                    additional: 'config'
                })
            );
        });

        it('should merge additional PHPCore config when provided', function () {
            loader.configure({}, [{base: 'config'}]);

            loader.createEnvironment({additional: 'config'});

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match({
                    my: 'PHPCore config',
                    additional: 'config'
                })
            );
        });

        it('should merge addons arrays when provided', function () {
            loader.configure({}, [{addons: ['base-addon']}]);

            loader.createEnvironment({addons: ['additional-addon']});

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match({
                    my: 'PHPCore config',
                    addons: ['base-addon', 'additional-addon']
                })
            );
        });

        it('should return the created Environment', function () {
            expect(loader.createEnvironment()).to.equal(environment);
        });
    });

    describe('getEnvironment()', function () {
        it('should pass the ModuleRepository to the EnvironmentProvider', function () {
            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.same(moduleRepository)
            );
        });

        it('should pass the InitialiserContext to the EnvironmentProvider', function () {
            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.same(initialiserContext)
            );
        });

        it('should pass the FileSystem to the EnvironmentProvider', function () {
            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.same(fileSystem)
            );
        });

        it('should pass the PHPify config that was passed to .configure()', function () {
            loader.configure({my: 'PHPify config'});

            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                {my: 'PHPify config'}
            );
        });

        it('should pass the PHPCore config that was passed to .configure()', function () {
            loader.configure({}, [{first: 'PHPCore config 1'}, {second: 'PHPCore config 2'}]);

            loader.getEnvironment();

            expect(environmentProvider.createEnvironment).to.have.been.calledOnce;
            expect(environmentProvider.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match({
                    my: 'PHPCore config'
                })
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
        beforeEach(function () {
            initialiserContext.isLoadingBootstraps.returns(false);
            moduleRepository.isLoadingModuleFactoryOnly.returns(false);
        });

        it('should use the Environment to require the module', function () {
            var module = {exports: null, id: 'my-module'};

            loader.load('my/module/path.php', module);

            expect(environment.requireModule).to.have.been.calledOnce;
            expect(environment.requireModule).to.have.been.calledWith('my/module/path.php');
        });

        it('should export the module execution result', function () {
            var module = {exports: null, id: 'my-module'};

            loader.load('my/module/path.php', module);

            expect(module.exports).to.equal('my module execution result');
        });

        describe('when loading bootstraps', function () {
            var bootstrapResult,
                module,
                moduleFactory;

            beforeEach(function () {
                bootstrapResult = function () {};
                module = {exports: null, id: 'my-module'};
                moduleFactory = sinon.stub();
                initialiserContext.isLoadingBootstraps.returns(true);
                moduleRepository.loadBootstrap.returns(bootstrapResult);
            });

            it('should load the bootstrap from the ModuleRepository', function () {
                loader.load('my/module/path.php', module, moduleFactory);

                expect(moduleRepository.loadBootstrap).to.have.been.calledOnce;
                expect(moduleRepository.loadBootstrap).to.have.been.calledWith(
                    'my/module/path.php',
                    'my-module',
                    moduleFactory
                );
            });

            it('should export the bootstrap result', function () {
                loader.load('my/module/path.php', module, moduleFactory);

                expect(module.exports).to.equal(bootstrapResult);
            });
        });

        describe('when in loading-module-factory mode', function () {
            var configuredFactory,
                module,
                moduleFactory;

            beforeEach(function () {
                configuredFactory = function () {};
                module = {exports: null, id: 'my-module'};
                moduleFactory = sinon.stub();
                moduleRepository.isLoadingModuleFactoryOnly.returns(true);
                moduleRepository.load.returns(configuredFactory);
            });

            it('should load the module via the ModuleRepository', function () {
                loader.load('my/module/path.php', module, moduleFactory);

                expect(moduleRepository.load).to.have.been.calledOnce;
                expect(moduleRepository.load).to.have.been.calledWith(
                    'my/module/path.php',
                    'my-module',
                    moduleFactory
                );
            });

            it('should export the configured factory', function () {
                loader.load('my/module/path.php', module, moduleFactory);

                expect(module.exports).to.equal(configuredFactory);
            });
        });
    });
});
