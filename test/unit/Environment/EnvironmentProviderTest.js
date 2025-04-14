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
    EnvironmentFactory = require('../../../src/Environment/EnvironmentFactory'),
    EnvironmentProvider = require('../../../src/Environment/EnvironmentProvider'),
    FileSystem = require('../../../src/FileSystem'),
    InitialiserContext = require('../../../src/Initialiser/InitialiserContext'),
    IO = require('../../../src/IO'),
    ModuleRepository = require('../../../src/ModuleRepository'),
    Performance = require('../../../src/Performance');

describe('EnvironmentProvider', function () {
    var environmentFactory,
        fileSystem,
        initialiserContext,
        io,
        moduleRepository,
        performance,
        phpCoreConfig,
        phpCoreEnvironment,
        phpifyConfig,
        phpRuntime,
        provider;

    beforeEach(function () {
        environmentFactory = sinon.createStubInstance(EnvironmentFactory);
        fileSystem = sinon.createStubInstance(FileSystem);
        initialiserContext = sinon.createStubInstance(InitialiserContext);
        io = sinon.createStubInstance(IO);
        moduleRepository = sinon.createStubInstance(ModuleRepository);
        performance = sinon.createStubInstance(Performance);
        phpCoreConfig = {};
        phpCoreEnvironment = {};
        phpifyConfig = {};
        phpRuntime = {
            createEnvironment: sinon.stub().returns(phpCoreEnvironment)
        };

        provider = new EnvironmentProvider(environmentFactory, phpRuntime, performance, io);
    });

    describe('createEnvironment()', function () {
        it('should create the PHPCore Environment with the FileSystem', function () {
            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(phpRuntime.createEnvironment).to.have.been.calledOnce;
            expect(phpRuntime.createEnvironment).to.have.been.calledWith(sinon.match({
                fileSystem: sinon.match.same(fileSystem)
            }));
        });

        it('should create the PHPCore Environment with an include transport', function () {
            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(phpRuntime.createEnvironment).to.have.been.calledOnce;
            expect(phpRuntime.createEnvironment).to.have.been.calledWith(sinon.match({
                include: sinon.match.typeOf('function')
            }));
        });

        it('should create the PHPCore Environment with the Performance abstraction', function () {
            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(phpRuntime.createEnvironment).to.have.been.calledOnce;
            expect(phpRuntime.createEnvironment).to.have.been.calledWith(sinon.match({
                performance: sinon.match.same(performance)
            }));
        });

        it('should pass any options through from the config', function () {
            phpCoreConfig.myOption = 'my value';

            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(phpRuntime.createEnvironment).to.have.been.calledOnce;
            expect(phpRuntime.createEnvironment).to.have.been.calledWith(sinon.match({
                myOption: 'my value'
            }));
        });

        it('should remove any addons from the options config', function () {
            phpCoreConfig.addons = [{'plugin': 'one'}];

            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(phpRuntime.createEnvironment).to.have.been.calledOnce;
            expect(phpRuntime.createEnvironment).to.have.been.calledWith(sinon.match(function (options) {
                return !{}.hasOwnProperty.call(options, 'addons');
            }));
        });

        it('should create the PHPCore Environment with any provided addons', function () {
            phpCoreConfig.addons = [{'addon': 'one'}];

            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(phpRuntime.createEnvironment).to.have.been.calledOnce;
            expect(phpRuntime.createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                [{'addon': 'one'}]
            );
        });

        describe('the include transport used for the PHPCore Environment', function () {
            it('should resolve the promise with the configured module factory from the FileSystem', function () {
                var moduleFactory = sinon.stub(),
                    resolve = sinon.stub();
                fileSystem.getModuleFactory
                    .withArgs('/my/file.php')
                    .returns(moduleFactory);

                provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);
                phpRuntime.createEnvironment.args[0][0].include('/my/file.php', {resolve: resolve});

                expect(resolve).to.have.been.calledOnce;
                expect(resolve).to.have.been.calledWith(moduleFactory);
            });

            it('should reject the promise with any error from the FileSystem', function () {
                var reject = sinon.stub();
                fileSystem.getModuleFactory
                    .withArgs('/my/unreadable/file.php')
                    .throws(new Error('Unreadable file'));

                provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);
                phpRuntime.createEnvironment.args[0][0].include('/my/unreadable/file.php', {reject: reject});

                expect(reject).to.have.been.calledOnce;
                expect(reject).to.have.been.calledWith(
                    sinon.match.instanceOf(Error)
                        .and(sinon.match.has('message', 'Unreadable file'))
                );
            });
        });

        it('should install the IO for the created PHPCore Environment', function () {
            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(io.install).to.have.been.calledOnce;
            expect(io.install).to.have.been.calledWith(sinon.match.same(phpCoreEnvironment));
        });

        it('should create the Environment with the PHPCore Environment, module repository and initialiser context', function () {
            provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig);

            expect(environmentFactory.createEnvironment).to.have.been.calledOnce;
            expect(environmentFactory.createEnvironment).to.have.been.calledWith(
                sinon.match.same(moduleRepository),
                sinon.match.same(initialiserContext),
                sinon.match.same(phpCoreEnvironment)
            );
        });

        it('should return the Environment created via the factory', function () {
            var environment = sinon.createStubInstance(Environment);
            environmentFactory.createEnvironment.returns(environment);

            expect(provider.createEnvironment(moduleRepository, initialiserContext, fileSystem, phpifyConfig, phpCoreConfig))
                .to.equal(environment);
        });
    });
});
