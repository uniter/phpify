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
    Environment = require('../../../src/Environment/Environment'),
    InitialiserContext = require('../../../src/Initialiser/InitialiserContext'),
    ModuleRepository = require('../../../src/ModuleRepository'),
    Promise = require('lie');

describe('Environment', function () {
    var bootstraps,
        environment,
        initialiserContext,
        moduleFactory,
        moduleRepository,
        phpCoreEnvironment;

    beforeEach(function () {
        bootstraps = [];
        initialiserContext = sinon.createStubInstance(InitialiserContext);
        moduleFactory = sinon.stub();
        moduleRepository = sinon.createStubInstance(ModuleRepository);
        phpCoreEnvironment = {
            getMode: sinon.stub().returns('sync')
        };

        initialiserContext.getBootstraps.returns(bootstraps);
        moduleRepository.getModuleFactory.withArgs('/path/to/module.php').returns(moduleFactory);

        environment = new Environment(moduleRepository, initialiserContext, phpCoreEnvironment);
    });

    describe('getPhpCoreEnvironment()', function () {
        it('should return the PHPCore environment', function () {
            expect(environment.getPhpCoreEnvironment()).to.equal(phpCoreEnvironment);
        });
    });

    describe('requireModule()', function () {
        var executeResult,
            moduleExecutable;

        beforeEach(function () {
            executeResult = {};
            moduleExecutable = {
                execute: sinon.stub().returns(executeResult)
            };
            moduleFactory.returns(moduleExecutable);
        });

        it('should fetch the module factory from the repository', function () {
            environment.requireModule('/path/to/module.php');

            expect(moduleRepository.getModuleFactory).to.have.been.calledOnce;
            expect(moduleRepository.getModuleFactory).to.have.been.calledWith('/path/to/module.php');
        });

        it('should mark the environment as bootstrapped after first module require', function () {
            environment.requireModule('/path/to/module.php');

            expect(environment.bootstrapped).to.be.true;
        });

        it('should fetch bootstraps from the initialiser context on first module require', function () {
            environment.requireModule('/path/to/module.php');

            expect(initialiserContext.getBootstraps).to.have.been.calledOnce;
        });

        it('should execute each bootstrap in sync mode', function () {
            var bootstrap1 = sinon.stub(),
                bootstrap2 = sinon.stub();
            bootstraps.push(bootstrap1);
            bootstraps.push(bootstrap2);

            environment.requireModule('/path/to/module.php');

            expect(bootstrap1).to.have.been.calledOnce;
            expect(bootstrap1).to.have.been.calledWith(sinon.match.same(phpCoreEnvironment));
            expect(bootstrap2).to.have.been.calledOnce;
            expect(bootstrap2).to.have.been.calledWith(sinon.match.same(phpCoreEnvironment));
        });

        it('should execute the module with the PHPCore environment', function () {
            environment.requireModule('/path/to/module.php');

            expect(moduleFactory).to.have.been.calledOnce;
            expect(moduleFactory).to.have.been.calledWith({}, sinon.match.same(phpCoreEnvironment));
            expect(moduleExecutable.execute).to.have.been.calledOnce;
        });

        it('should return the result of module execution', function () {
            var result = environment.requireModule('/path/to/module.php');

            expect(result).to.equal(executeResult);
        });

        it('should not fetch bootstraps again on subsequent module requires', function () {
            environment.requireModule('/path/to/module.php');
            environment.requireModule('/path/to/module.php');

            expect(initialiserContext.getBootstraps).to.have.been.calledOnce;
        });

        it('should not execute bootstraps again on subsequent module requires', function () {
            var bootstrap = sinon.stub();
            bootstraps.push(bootstrap);

            environment.requireModule('/path/to/module.php');
            environment.requireModule('/path/to/module.php');

            expect(bootstrap).to.have.been.calledOnce;
        });

        describe('in async mode', function () {
            var asyncBootstrap1,
                asyncBootstrap2,
                resolveBootstrap1,
                resolveBootstrap2;

            beforeEach(function () {
                phpCoreEnvironment.getMode.returns('async');
                asyncBootstrap1 = sinon.stub();
                asyncBootstrap2 = sinon.stub();

                bootstraps.push(asyncBootstrap1);
                bootstraps.push(asyncBootstrap2);
            });

            it('should return a Promise', function () {
                var result;
                asyncBootstrap1.returns(Promise.resolve());

                result = environment.requireModule('/path/to/module.php');

                expect(result).to.be.an.instanceOf(Promise);
            });

            it('should process async bootstraps in sequence', async function () {
                let bootstrap1Promise = new Promise(resolve => {
                    resolveBootstrap1 = resolve;
                });
                let bootstrap2Promise = new Promise(resolve => {
                    resolveBootstrap2 = resolve;
                });

                asyncBootstrap1.returns(bootstrap1Promise);
                asyncBootstrap2.returns(bootstrap2Promise);

                let requirePromise = environment.requireModule('/path/to/module.php');

                expect(asyncBootstrap1).to.have.been.calledOnce;
                expect(asyncBootstrap1).to.have.been.calledWith(sinon.match.same(phpCoreEnvironment));
                expect(asyncBootstrap2).not.to.have.been.called;
                resolveBootstrap1();
                await Promise.resolve(); // Allow promise resolution microtask to run.
                expect(asyncBootstrap2).to.have.been.calledOnce;
                expect(asyncBootstrap2).to.have.been.calledWith(sinon.match.same(phpCoreEnvironment));
                resolveBootstrap2();
                await requirePromise;
                expect(asyncBootstrap2).to.have.been.calledAfter(asyncBootstrap1);
            });

            it('should execute the module after all bootstraps are complete', async function () {
                let bootstrap1Promise = new Promise(resolve => {
                    resolveBootstrap1 = resolve;
                });

                asyncBootstrap1.returns(bootstrap1Promise);
                asyncBootstrap2.returns(null); // Synchronous bootstrap.

                let requirePromise = environment.requireModule('/path/to/module.php');

                expect(moduleFactory).not.to.have.been.called;
                resolveBootstrap1();
                await requirePromise;
                expect(moduleFactory).to.have.been.calledOnce;
                expect(moduleFactory).to.have.been.calledWith({}, sinon.match.same(phpCoreEnvironment));
                expect(moduleExecutable.execute).to.have.been.calledOnce;
            });

            it('should not load the PHP module following an error during bootstrap', async function () {
                const testError = new Error('Bootstrap error');
                asyncBootstrap1.returns(Promise.reject(testError));

                const requirePromise = environment.requireModule('/path/to/module.php');

                await expect(requirePromise).to.be.rejectedWith(testError);
                expect(moduleFactory).not.to.have.been.called;
            });
        });
    });
});
