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
    EnvironmentProvider = require('../../src/Environment/EnvironmentProvider'),
    InitialiserLoader = require('../../src/Initialiser/InitialiserLoader'),
    RealFileSystem = require('../../src/FileSystem'),
    RealInitialiserContext = require('../../src/Initialiser/InitialiserContext'),
    RealLoader = require('../../src/Loader'),
    RealModuleRepository = require('../../src/ModuleRepository');

describe('API', function () {
    var api,
        Environment,
        EnvironmentFactory,
        environmentProvider,
        FileSystem,
        fileSystem,
        initialiser,
        InitialiserContext,
        initialiserContext,
        initialiserLoader,
        Loader,
        loader,
        ModuleRepository,
        moduleRepository,
        phpConfigImporter,
        requireCache;

    beforeEach(function () {
        Environment = sinon.stub();
        EnvironmentFactory = sinon.stub();
        environmentProvider = sinon.createStubInstance(EnvironmentProvider);
        FileSystem = sinon.stub();
        fileSystem = sinon.createStubInstance(RealFileSystem);
        initialiser = sinon.stub();
        InitialiserContext = sinon.stub();
        initialiserContext = sinon.createStubInstance(RealInitialiserContext);
        initialiserLoader = sinon.createStubInstance(InitialiserLoader);
        Loader = sinon.stub();
        loader = sinon.createStubInstance(RealLoader);
        ModuleRepository = sinon.stub();
        moduleRepository = sinon.createStubInstance(RealModuleRepository);
        phpConfigImporter = {};
        requireCache = {};

        FileSystem.returns(fileSystem);
        InitialiserContext.returns(initialiserContext);
        initialiserLoader.loadInitialiser.returns(initialiser);
        Loader.returns(loader);
        ModuleRepository.returns(moduleRepository);

        api = new API(
            FileSystem,
            Loader,
            ModuleRepository,
            InitialiserContext,
            environmentProvider,
            initialiserLoader,
            phpConfigImporter,
            requireCache
        );
    });

    describe('createLoader()', function () {
        it('should create the ModuleRepository with require.cache', function () {
            ModuleRepository.resetHistory();

            api.createLoader();

            expect(ModuleRepository).to.have.been.calledOnce;
            expect(ModuleRepository).to.have.been.calledWith(requireCache);
        });

        it('should create the FileSystem with a ModuleRepository instance', function () {
            FileSystem.resetHistory();

            api.createLoader();

            expect(FileSystem).to.have.been.calledOnce;
            expect(FileSystem).to.have.been.calledWith(moduleRepository);
        });

        it('should only create one FileSystem', function () {
            FileSystem.resetHistory();

            api.createLoader();

            expect(FileSystem).to.have.been.calledOnce;
        });

        it('should create the InitialiserContext', function () {
            InitialiserContext.resetHistory();

            api.createLoader();

            expect(InitialiserContext).to.have.been.calledOnce;
        });

        it('should load the initialiser via the InitialiserLoader', function () {
            initialiserLoader.loadInitialiser.resetHistory();

            api.createLoader();

            expect(initialiserLoader.loadInitialiser).to.have.been.calledOnce;
        });

        it('should create the Loader with an instance of ModuleRepository', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader.args[0][0]).to.equal(moduleRepository);
        });

        it('should create the Loader with the created FileSystem', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader.args[0][2]).to.equal(fileSystem);
        });

        it('should create the Loader with the EnvironmentProvider', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader.args[0][3]).to.equal(environmentProvider);
        });

        it('should create the Loader with the ConfigImporter', function () {
            api.createLoader();

            expect(Loader).to.have.been.calledOnce;
            expect(Loader.args[0][4]).to.equal(phpConfigImporter);
        });

        it('should call the initialiser with the loader', function () {
            api.createLoader();

            expect(initialiser).to.have.been.calledOnce;
            expect(initialiser).to.have.been.calledWith(sinon.match.same(loader));
        });

        it('should return the created Loader', function () {
            expect(api.createLoader()).to.equal(loader);
        });
    });
});
