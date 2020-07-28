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
            './my/first/module/path.php': {},
            './my/second/module/path.php': {}
        };

        // First fake module file that does exist
        originalFirstModuleFactory = sinon.stub();
        originalFirstModuleFactory.using = sinon.stub();
        configuredFirstModuleFactory = sinon.stub();
        originalFirstModuleFactory.using
            .withArgs({path: 'my/first/module/path.php'}, sinon.match.same(environment))
            .returns(configuredFirstModuleFactory);
        moduleFactoryFetcher
            .withArgs('my/first/module/path.php', false)
            .callsFake(function (path) {
                return repository.load(path, originalFirstModuleFactory, environment);
            });
        moduleFactoryFetcher
            .withArgs('my/first/module/path.php', true)
            .returns(true);

        // Second fake module file that does exist
        originalSecondModuleFactory = sinon.stub();
        originalSecondModuleFactory.using = sinon.stub();
        configuredSecondModuleFactory = sinon.stub();
        originalSecondModuleFactory.using
            .withArgs({path: 'my/second/module/path.php'}, sinon.match.same(environment))
            .returns(configuredSecondModuleFactory);
        moduleFactoryFetcher
            .withArgs('my/second/module/path.php', false)
            .callsFake(function (path) {
                return repository.load(path, originalSecondModuleFactory, environment);
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
                        repository.load(path, originalFirstModuleFactory, environment);

                        return {}; // Incorrect: this should be returning the configured module factory
                    });

                expect(function () {
                    repository.getModuleFactory('my/first/module/path.php');
                }).to.throw('Unexpected state: factory for module "my/first/module/path.php" loaded incorrectly');
            });

            it('should throw when the fetcher does not cache the module in require.cache[...] correctly', function () {
                delete requireCache['./my/first/module/path.php'];

                expect(function () {
                    repository.getModuleFactory('my/first/module/path.php');
                }).to.throw('Expected path "./my/first/module/path.php" to be in require.cache, but it was not');
            });

            it('should remove the module from require.cache', function () {
                repository.getModuleFactory('my/first/module/path.php');

                expect(requireCache).not.to.have.property('./my/first/module/path.php');
            });

            it('should return the configured module factory', function () {
                expect(repository.getModuleFactory('my/first/module/path.php')).to.equal(configuredFirstModuleFactory);
            });
        });

        describe('on subsequent fetches of a module', function () {
            beforeEach(function () {
                // Perform the initial fetch
                repository.getModuleFactory('my/first/module/path.php');
            });

            it('should return the cached configured module factory', function () {
                expect(repository.getModuleFactory('my/first/module/path.php'))
                    .to.equal(configuredFirstModuleFactory);
            });

            it('should not invoke the fetcher again', function () {
                expect(moduleFactoryFetcher).to.have.been.calledOnce;
            });
        });
    });

    describe('load()', function () {
        var configuredModuleFactory,
            engine,
            originalModuleFactory;

        beforeEach(function () {
            engine = {
                execute: sinon.stub()
            };
            originalModuleFactory = sinon.stub();
            configuredModuleFactory = sinon.stub();

            originalModuleFactory.using = sinon.stub().returns(configuredModuleFactory);
            configuredModuleFactory.returns(engine);
        });

        it('should return a configured factory when in loading mode', function () {
            var configuredModuleFactory;
            moduleFactoryFetcher
                .withArgs('my/first/module/path.php', false)
                .callsFake(function (path) {
                    configuredModuleFactory = repository.load(path, originalFirstModuleFactory, environment);

                    return configuredModuleFactory;
                });

            repository.getModuleFactory('my/first/module/path.php');

            expect(configuredModuleFactory).to.equal(configuredFirstModuleFactory);
        });

        it('should execute and return the result of the configured factory when not in loading mode', function () {
            var result = {};
            engine.execute.returns(result);

            expect(repository.load('my/first/module/path.php', originalModuleFactory, environment))
                .to.equal(result);
        });

        it('should pass the path of the module to [moduleFactory].using(...) as an option', function () {
            repository.load('my/first/module/path.php', originalModuleFactory, environment);

            expect(originalModuleFactory.using).to.have.been.calledWith(sinon.match({
                path: 'my/first/module/path.php'
            }));
        });

        it('should pass the Environment through to [moduleFactory].using(...)', function () {
            repository.load('my/first/module/path.php', originalModuleFactory, environment);

            expect(originalModuleFactory.using).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.same(environment)
            );
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
                // Perform the initial fetch
                repository.getModuleFactory('my/first/module/path.php');

                expect(repository.moduleExists('my/first/module/path.php')).to.be.true;
            });
        });
    });
});
