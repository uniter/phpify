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
    IO = require('../../src/IO'),
    Performance = require('../../src/Performance');

describe('EnvironmentProvider', function () {
    var createEnvironment,
        environment,
        fileSystem,
        io,
        performance,
        phpCoreConfig,
        phpifyConfig,
        phpRuntime,
        provider;

    beforeEach(function () {
        environment = {};
        fileSystem = sinon.createStubInstance(FileSystem);
        createEnvironment = sinon.stub().returns(environment);
        io = sinon.createStubInstance(IO);
        performance = sinon.createStubInstance(Performance);
        phpCoreConfig = {};
        phpifyConfig = {};
        phpRuntime = {
            createEnvironment: createEnvironment
        };

        provider = new EnvironmentProvider(phpRuntime, performance, io);
    });

    describe('createEnvironment()', function () {
        it('should create the Environment with the FileSystem', function () {
            provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(sinon.match({
                fileSystem: sinon.match.same(fileSystem)
            }));
        });

        it('should create the Environment with an include transport', function () {
            provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(sinon.match({
                include: sinon.match.typeOf('function')
            }));
        });

        it('should create the Environment with the Performance abstraction', function () {
            provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(sinon.match({
                performance: sinon.match.same(performance)
            }));
        });

        it('should remove any plugins from the options config', function () {
            phpCoreConfig.plugins = [{'plugin': 'one'}];

            provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(sinon.match(function (options) {
                return !{}.hasOwnProperty.call(options, 'plugins');
            }));
        });

        it('should create the Environment with any provided plugins', function () {
            phpCoreConfig.plugins = [{'plugin': 'one'}];

            provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(
                sinon.match.any,
                [{'plugin': 'one'}]
            );
        });

        describe('the include transport used for the Environment', function () {
            it('should resolve the promise with the configured module factory from the FileSystem', function () {
                var moduleFactory = sinon.stub(),
                    resolve = sinon.stub();
                fileSystem.getModuleFactory
                    .withArgs('/my/file.php')
                    .returns(moduleFactory);

                provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);
                createEnvironment.args[0][0].include('/my/file.php', {resolve: resolve});

                expect(resolve).to.have.been.calledOnce;
                expect(resolve).to.have.been.calledWith(moduleFactory);
            });

            it('should reject the promise with any error from the FileSystem', function () {
                var reject = sinon.stub();
                fileSystem.getModuleFactory
                    .withArgs('/my/unreadable/file.php')
                    .throws(new Error('Unreadable file'));

                provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);
                createEnvironment.args[0][0].include('/my/unreadable/file.php', {reject: reject});

                expect(reject).to.have.been.calledOnce;
                expect(reject).to.have.been.calledWith(
                    sinon.match.instanceOf(Error)
                        .and(sinon.match.has('message', 'Unreadable file'))
                );
            });
        });

        it('should install the IO for the created Environment', function () {
            provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig);

            expect(io.install).to.have.been.calledOnce;
            expect(io.install).to.have.been.calledWith(sinon.match.same(environment));
        });

        it('should return the created Environment', function () {
            expect(provider.createEnvironment(fileSystem, phpifyConfig, phpCoreConfig)).to.equal(environment);
        });
    });
});
