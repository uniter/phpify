/*
 * PHPify - Browserify transform
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
    FileSystem = require('../../src/FileSystem'),
    Performance = require('../../src/Performance');

describe('API', function () {
    beforeEach(function () {
        this.FileSystem = sinon.stub();
        this.Loader = sinon.stub();
        this.createEnvironment = sinon.stub();
        this.performance = sinon.createStubInstance(Performance);
        this.phpRuntime = {
            createEnvironment: this.createEnvironment
        };

        this.api = new API(this.FileSystem, this.Loader, this.phpRuntime, this.performance);
    });

    describe('createLoader()', function () {
        it('should create the Environment with a FileSystem instance', function () {
            this.api.createLoader();

            expect(this.createEnvironment).to.have.been.calledOnce;
            expect(this.createEnvironment).to.have.been.calledWith(sinon.match({
                fileSystem: sinon.match.instanceOf(this.FileSystem)
            }));
        });

        it('should create the Environment with an include transport', function () {
            this.api.createLoader();

            expect(this.createEnvironment).to.have.been.calledOnce;
            expect(this.createEnvironment).to.have.been.calledWith(sinon.match({
                include: sinon.match.typeOf('function')
            }));
        });

        it('should create the Environment with the Performance abstraction', function () {
            this.api.createLoader();

            expect(this.createEnvironment).to.have.been.calledOnce;
            expect(this.createEnvironment).to.have.been.calledWith(sinon.match({
                performance: sinon.match.same(this.performance)
            }));
        });

        describe('the include transport used for the Environment', function () {
            it('should resolve the promise with the compiled file from the FileSystem', function () {
                var fileSystem = sinon.createStubInstance(FileSystem),
                    moduleFactory = sinon.stub(),
                    resolve = sinon.stub();
                this.FileSystem.returns(fileSystem);
                fileSystem.compilePHPFile.withArgs('/my/file.php').returns(moduleFactory);

                this.api.createLoader();
                this.createEnvironment.args[0][0].include('/my/file.php', {resolve: resolve});

                expect(resolve).to.have.been.calledOnce;
                expect(resolve).to.have.been.calledWith(moduleFactory);
            });

            it('should reject the promise with any error from the FileSystem', function () {
                var fileSystem = sinon.createStubInstance(FileSystem),
                    reject = sinon.stub();
                this.FileSystem.returns(fileSystem);
                fileSystem.compilePHPFile.withArgs('/my/unreadable/file.php').throws(new Error('Unreadable file'));

                this.api.createLoader();
                this.createEnvironment.args[0][0].include('/my/unreadable/file.php', {reject: reject});

                expect(reject).to.have.been.calledOnce;
                expect(reject).to.have.been.calledWith(new Error('Unreadable file'));
            });
        });

        it('should only create one FileSystem', function () {
            this.api.createLoader();

            expect(this.FileSystem).to.have.been.calledOnce;
        });

        it('should create the Loader with an instance of FileSystem', function () {
            this.api.createLoader();

            expect(this.Loader).to.have.been.calledOnce;
            expect(this.Loader).to.have.been.calledWith(sinon.match.instanceOf(this.FileSystem));
        });

        it('should create the Loader with the created Environment', function () {
            var environment = {};
            this.createEnvironment.returns(environment);

            this.api.createLoader();

            expect(this.Loader).to.have.been.calledOnce;
            expect(this.Loader).to.have.been.calledWith(sinon.match.any, sinon.match.same(environment));
        });

        it('should return an instance of Loader', function () {
            expect(this.api.createLoader()).to.be.an.instanceOf(this.Loader);
        });
    });
});
