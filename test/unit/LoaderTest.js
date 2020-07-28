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
    Loader = require('../../src/Loader'),
    ModuleRepository = require('../../src/ModuleRepository');

describe('Loader', function () {
    var environment,
        loader,
        moduleRepository;

    beforeEach(function () {
        environment = {};
        moduleRepository = sinon.createStubInstance(ModuleRepository);

        loader = new Loader(moduleRepository, environment);
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

    describe('init()', function () {
        var moduleFactoryFetcher;

        beforeEach(function () {
            moduleFactoryFetcher = sinon.stub();
        });

        it('should initialize the FileSystem', function () {
            loader.init(moduleFactoryFetcher);

            expect(moduleRepository.init).to.have.been.calledOnce;
        });

        it('should only initialize the FileSystem once', function () {
            loader.init(moduleFactoryFetcher);

            loader.init(moduleFactoryFetcher); // Init a second time

            expect(moduleRepository.init).to.have.been.calledOnce;
        });

        it('should pass the module factory fetcher through to the FileSystem', function () {
            loader.init(moduleFactoryFetcher);

            expect(moduleRepository.init).to.have.been.calledWith(sinon.match.same(moduleFactoryFetcher));
        });
    });

    describe('load()', function () {
        it('should load the module factory via the ModuleRepository correctly', function () {
            var moduleFactory = sinon.stub();
            moduleRepository.load.returns(moduleFactory);

            loader.load('my/module/path.php', moduleFactory);

            expect(moduleRepository.load).to.have.been.calledOnce;
            expect(moduleRepository.load).to.have.been.calledWith(
                'my/module/path.php',
                sinon.match.same(moduleFactory),
                sinon.match.same(environment)
            );
        });

        it('should return the module factory from the ModuleRepository', function () {
            var moduleFactory = sinon.stub();
            moduleRepository.load.returns(moduleFactory);

            expect(loader.load('my/module/path.php', moduleFactory)).to.equal(moduleFactory);
        });
    });
});
