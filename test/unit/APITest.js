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
    API = require('../../src/API'),
    Performance = require('../../src/Performance');

describe('API', function () {
    var api,
        createEnvironment,
        FileSystem,
        Loader,
        ModuleRepository,
        performance,
        phpRuntime;

    beforeEach(function () {
        FileSystem = sinon.stub();
        Loader = sinon.stub();
        ModuleRepository = sinon.stub();
        createEnvironment = sinon.stub();
        performance = sinon.createStubInstance(Performance);
        phpRuntime = {
            createEnvironment: createEnvironment
        };

        FileSystem.prototype.getModuleFactory = function () {};

        api = new API(FileSystem, Loader, ModuleRepository, phpRuntime, performance);
    });

    describe('createLoader()', function () {
        it('should create the FileSystem with a ModuleRepository instance', function () {
            api.createLoader();

            expect(FileSystem).to.have.been.calledOnce;
            expect(FileSystem).to.have.been.calledWith(sinon.match.instanceOf(ModuleRepository));
        });

        it('should create the ModuleRepository with require.cache', function () {
            api.createLoader();

            expect(ModuleRepository).to.have.been.calledOnce;
            expect(ModuleRepository).to.have.been.calledWith(require.cache);
        });

        it('should create the Environment with a FileSystem instance', function () {
            api.createLoader();

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(sinon.match({
                fileSystem: sinon.match.instanceOf(FileSystem)
            }));
        });

        it('should create the Environment with an include transport', function () {
            api.createLoader();

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(sinon.match({
                include: sinon.match.typeOf('function')
            }));
        });

        it('should create the Environment with the Performance abstraction', function () {
            api.createLoader();

            expect(createEnvironment).to.have.been.calledOnce;
            expect(createEnvironment).to.have.been.calledWith(sinon.match({
                performance: sinon.match.same(performance)
            }));
        });

        describe('the include transport used for the Environment', function () {
            it('should resolve the promise with the configured module factory from the FileSystem', function () {
                var fileSystem = sinon.createStubInstance(FileSystem),
                    moduleFactory = sinon.stub(),
                    resolve = sinon.stub();
                FileSystem.returns(fileSystem);
                fileSystem.getModuleFactory
                    .withArgs('/my/file.php')
                    .returns(moduleFactory);

                api.createLoader();
                createEnvironment.args[0][0].include('/my/file.php', {resolve: resolve});

                expect(resolve).to.have.been.calledOnce;
                expect(resolve).to.have.been.calledWith(moduleFactory);
            });

            it('should reject the promise with any error from the FileSystem', function () {
                var fileSystem = sinon.createStubInstance(FileSystem),
                    reject = sinon.stub();
                FileSystem.returns(fileSystem);
                fileSystem.getModuleFactory
                    .withArgs('/my/unreadable/file.php')
                    .throws(new Error('Unreadable file'));

                api.createLoader();
                createEnvironment.args[0][0].include('/my/unreadable/file.php', {reject: reject});

                expect(reject).to.have.been.calledOnce;
                expect(reject).to.have.been.calledWith(
                    sinon.match.instanceOf(Error)
                        .and(sinon.match.has('message', 'Unreadable file'))
                );
            });
        });

        it('should only create one FileSystem', function () {
            api.createLoader();

            expect(FileSystem).to.have.been.calledOnce;
        });

        it('should create the Loader with an instance of ModuleRepository', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader).to.have.been.calledWith(sinon.match.instanceOf(ModuleRepository));
        });

        it('should create the Loader with the created Environment', function () {
            var environment = {};
            createEnvironment.returns(environment);

            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader).to.have.been.calledWith(sinon.match.any, sinon.match.same(environment));
        });

        it('should return an instance of Loader', function () {
            expect(api.createLoader()).to.be.an.instanceOf(Loader);
        });
    });
});
