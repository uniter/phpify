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
    hasOwn = {}.hasOwnProperty,
    sinon = require('sinon'),
    ModuleRepository = require('../../src/ModuleRepository');

describe('ModuleRepository', function () {
    var configuredFirstModuleFactory,
        configuredSecondModuleFactory,
        environment,
        moduleFactoryFetcher,
        originalFirstModuleFactory,
        originalSecondModuleFactory,
        repository,
        requireCache;

    beforeEach(function () {
        environment = {};
        moduleFactoryFetcher = sinon.stub();
        requireCache = {
            'first-module-id': {},
            'second-module-id': {}
        };

        // First fake module file that does exist
        originalFirstModuleFactory = sinon.stub();
        originalFirstModuleFactory.using = sinon.stub();
        configuredFirstModuleFactory = sinon.stub();
        originalFirstModuleFactory.using
            .withArgs({path: 'my/first/module/path.php'})
            .returns(configuredFirstModuleFactory);
        moduleFactoryFetcher
            .withArgs('my/first/module/path.php', false)
            .callsFake(function (path) {
                return repository.load(path, 'first-module-id', originalFirstModuleFactory);
            });
        moduleFactoryFetcher
            .withArgs('my/first/module/path.php', true)
            .returns(true);

        // Second fake module file that does exist
        originalSecondModuleFactory = sinon.stub();
        originalSecondModuleFactory.using = sinon.stub();
        configuredSecondModuleFactory = sinon.stub();
        originalSecondModuleFactory.using
            .withArgs({path: 'my/second/module/path.php'})
            .returns(configuredSecondModuleFactory);
        moduleFactoryFetcher
            .withArgs('my/second/module/path.php', false)
            .callsFake(function (path) {
                return repository.load(path, 'second-module-id', originalSecondModuleFactory);
            });
        moduleFactoryFetcher
            .withArgs('my/second/module/path.php', true)
            .returns(true);

        // A fake file that does not exist
        moduleFactoryFetcher
            .withArgs('my/non-existent/module/path.php', true)
            .returns(false);

        repository = new ModuleRepository(requireCache);
        repository.init(moduleFactoryFetcher);
    });

    describe('getModuleFactory()', function () {
        describe('on the initial fetch of a module', function () {
            it('should invoke the fetcher correctly', function () {
                repository.getModuleFactory('my/first/module/path.php');

                expect(moduleFactoryFetcher).to.have.been.calledOnce;
                expect(moduleFactoryFetcher).to.have.been.calledWith(
                    'my/first/module/path.php',
                    false // Flag indicating that this is not just an existence check
                );
            });

            it('should throw when the module does not exist according to the fetcher', function () {
                moduleFactoryFetcher
                    .withArgs('my/first/module/path.php', false)
                    .returns(null);

                expect(function () {
                    repository.getModuleFactory('my/first/module/path.php');
                }).to.throw('File "my/first/module/path.php" is not in the compiled PHP file map');
            });

            it('should throw when the fetcher does not result in a call to .load()', function () {
                moduleFactoryFetcher
                    .withArgs('my/first/module/path.php', false)
                    // Do nothing, but also do not return null as that would indicate
                    // that the module does not exist
                    .returns({});

                expect(function () {
                    repository.getModuleFactory('my/first/module/path.php');
                }).to.throw('Unexpected state: module "my/first/module/path.php" should have been loaded by now');
            });

            it('should throw when the fetcher does not return the cached configured module factory', function () {
                moduleFactoryFetcher
                    .withArgs('my/first/module/path.php', false)
                    .callsFake(function (path) {
                        repository.load(path, 'first-module-id', originalFirstModuleFactory);

                        return {}; // Incorrect: this should be returning the configured module factory
                    });

                expect(function () {
                    repository.getModuleFactory('my/first/module/path.php');
                }).to.throw('Unexpected state: factory for module "my/first/module/path.php" loaded incorrectly');
            });

            it('should throw when the fetcher does not cache the module in require.cache[...] correctly', function () {
                delete requireCache['first-module-id'];

                expect(function () {
                    repository.getModuleFactory('my/first/module/path.php');
                }).to.throw(
                    'Path "./my/first/module/path.php" (id "first-module-id") is not in require.cache'
                );
            });

            it('should remove the module from require.cache', function () {
                repository.getModuleFactory('my/first/module/path.php');

                expect(requireCache).not.to.have.property('first-module-id');
            });

            it('should return the configured module factory', function () {
                expect(repository.getModuleFactory('my/first/module/path.php')).to.equal(configuredFirstModuleFactory);
            });
        });

        describe('on subsequent fetches of a module', function () {
            beforeEach(function () {
                // Perform the initial fetch.
                repository.getModuleFactory('my/first/module/path.php');
            });

            it('should return the cached configured module factory', function () {
                expect(repository.getModuleFactory('my/first/module/path.php'))
                    .to.equal(configuredFirstModuleFactory);
            });

            it('should not invoke the fetcher again', function () {
                moduleFactoryFetcher.resetHistory();

                repository.getModuleFactory('my/first/module/path.php');

                expect(moduleFactoryFetcher).not.to.have.been.called;
            });
        });
    });

    describe('init()', function () {
        it('should set the module factory fetcher', function () {
            var newFetcher = sinon.stub();
            repository.init(newFetcher);

            moduleFactoryFetcher.resetHistory();
            repository.moduleExists('my/first/module/path.php');

            expect(moduleFactoryFetcher).not.to.have.been.called;
            expect(newFetcher).to.have.been.calledOnce;
            expect(newFetcher).to.have.been.calledWith('my/first/module/path.php', true);
        });
    });

    describe('isLoadingModuleFactoryOnly()', function () {
        it('should return the current loading module factory only state', function () {
            // Default state should be false.
            expect(repository.isLoadingModuleFactoryOnly()).to.be.false;
            repository.getModuleFactory('my/first/module/path.php');
            // State should be back to false after operation completes.
            expect(repository.isLoadingModuleFactoryOnly()).to.be.false;
        });
    });

    describe('load()', function () {
        var configuredModuleFactory,
            originalModuleFactory;

        beforeEach(function () {
            originalModuleFactory = sinon.stub();
            configuredModuleFactory = sinon.stub();

            originalModuleFactory.using = sinon.stub().returns(configuredModuleFactory);
        });

        it('should return a configured factory', function () {
            var loadResult;
            moduleFactoryFetcher
                .withArgs('my/first/module/path.php', false)
                .callsFake(function (path) {
                    loadResult = repository.load(path, 'first-module-id', originalModuleFactory);
                    return loadResult;
                });

            repository.getModuleFactory('my/first/module/path.php');

            expect(moduleFactoryFetcher).to.have.been.calledOnce;
            expect(loadResult).to.equal(configuredModuleFactory);
        });

        it('should correctly configure the factory with the module path and id', function () {
            repository.load('my/first/module/path.php', 'first-module-id', originalModuleFactory);

            expect(originalModuleFactory.using).to.have.been.calledOnce;
            expect(originalModuleFactory.using).to.have.been.calledWith({
                path: 'my/first/module/path.php'
            });
        });

        it('should pass the path of the module to [moduleFactory].using(...) as an option', function () {
            repository.load('my/third/module/path.php', 'second-module-id', originalModuleFactory);

            expect(originalModuleFactory.using).to.have.been.calledWith({
                path: 'my/third/module/path.php'
            });
        });
    });

    describe('loadBootstrap()', function () {
        var bootstrapModuleFactory,
            configuredFactory,
            engine,
            bootstrapResult;

        beforeEach(function () {
            engine = {
                execute: sinon.stub()
            };
            bootstrapResult = {};
            engine.execute.returns(bootstrapResult);

            bootstrapModuleFactory = sinon.stub();
            configuredFactory = sinon.stub();
            configuredFactory.returns(engine);

            bootstrapModuleFactory.using = sinon.stub().returns(configuredFactory);
        });

        it('should configure the factory with the module path', function () {
            repository.loadBootstrap('my/bootstrap/path.php', 'bootstrap-id', bootstrapModuleFactory);

            expect(bootstrapModuleFactory.using).to.have.been.calledOnce;
            expect(bootstrapModuleFactory.using).to.have.been.calledWith({
                path: 'my/bootstrap/path.php'
            });
        });

        it('should store the bootstrap in configuredModules', function () {
            var bootstrapFn = repository.loadBootstrap('my/bootstrap/path.php', 'bootstrap-id', bootstrapModuleFactory),
                result;

            expect(repository.moduleExists('my/bootstrap/path.php')).to.be.true;

            // Add the bootstrap to the require cache to simulate what would happen in real usage.
            requireCache['bootstrap-id'] = {
                exports: configuredFactory
            };

            result = bootstrapFn(environment);

            expect(hasOwn.call(requireCache, 'bootstrap-id')).to.be.false;
            expect(configuredFactory).to.have.been.calledWith({}, environment);
            expect(engine.execute).to.have.been.calledOnce;
            expect(result).to.equal(bootstrapResult);
        });
    });

    describe('moduleExists()', function () {
        describe('when the module\'s factory has not been fetched', function () {
            it('should return true when the module factory fetcher indicates', function () {
                expect(repository.moduleExists('my/first/module/path.php')).to.be.true;
            });

            it('should return false when the module factory fetcher indicates', function () {
                expect(repository.moduleExists('my/non-existent/module/path.php')).to.be.false;
            });
        });

        describe('when the module\'s factory has already been fetched', function () {
            it('should return true', function () {
                repository.getModuleFactory('my/first/module/path.php');

                expect(repository.moduleExists('my/first/module/path.php')).to.be.true;
            });
        });
    });

    describe('unrequire()', function () {
        it('should throw when the module is not loaded', function () {
            expect(function () {
                repository.unrequire('non/existent/module.php');
            }).to.throw('Module "non/existent/module.php" is not loaded');
        });

        it('should throw when the module is not in require.cache', function () {
            repository.load('my/third/module/path.php', 'third-module-id', originalFirstModuleFactory);
            delete requireCache['third-module-id'];

            expect(function () {
                repository.unrequire('my/third/module/path.php');
            }).to.throw('Path "./my/third/module/path.php" (id "third-module-id") is not in require.cache');
        });

        it('should remove the module from require.cache', function () {
            repository.load('my/third/module/path.php', 'third-module-id', originalFirstModuleFactory);
            requireCache['third-module-id'] = {};

            repository.unrequire('my/third/module/path.php');

            expect(hasOwn.call(requireCache, 'third-module-id')).to.be.false;
        });
    });
});
