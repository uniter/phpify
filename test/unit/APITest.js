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
    EnvironmentProvider = require('../../src/EnvironmentProvider');

describe('API', function () {
    var api,
        environmentProvider,
        FileSystem,
        fileSystem,
        Loader,
        ModuleRepository,
        phpConfigImporter,
        requireCache;

    beforeEach(function () {
        environmentProvider = sinon.createStubInstance(EnvironmentProvider);
        FileSystem = sinon.stub();
        fileSystem = {};
        Loader = sinon.stub();
        ModuleRepository = sinon.stub();
        phpConfigImporter = {};
        requireCache = {};

        FileSystem.returns(fileSystem);
        FileSystem.prototype.getModuleFactory = function () {};

        api = new API(FileSystem, Loader, ModuleRepository, environmentProvider, phpConfigImporter, requireCache);
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
            expect(ModuleRepository).to.have.been.calledWith(requireCache);
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

        it('should create the Loader with the created FileSystem', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader).to.have.been.calledWith(sinon.match.any, sinon.match.same(fileSystem));
        });

        it('should create the Loader with the EnvironmentProvider', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.same(environmentProvider)
            );
        });

        it('should create the Loader with the ConfigImporter', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.any,
                sinon.match.any,
                sinon.match.same(phpConfigImporter)
            );
        });

        it('should return an instance of Loader', function () {
            expect(api.createLoader()).to.be.an.instanceOf(Loader);
        });
    });
});
