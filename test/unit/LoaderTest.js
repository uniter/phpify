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
    FileSystem = require('../../src/FileSystem'),
    Loader = require('../../src/Loader');

describe('Loader', function () {
    beforeEach(function () {
        this.environment = {};
        this.fileSystem = sinon.createStubInstance(FileSystem);

        this.loader = new Loader(this.fileSystem, this.environment);
    });

    describe('compilePHPFile()', function () {
        it('should return the result from the FileSystem', function () {
            var moduleFactory = sinon.stub();
            this.fileSystem.compilePHPFile.withArgs('/my/php/file/path.php').returns(moduleFactory);

            expect(this.loader.compilePHPFile('/my/php/file/path.php')).to.equal(moduleFactory);
        });
    });

    describe('init()', function () {
        it('should initialize the FileSystem', function () {
            this.loader.init();

            expect(this.fileSystem.init).to.have.been.calledOnce;
        });

        it('should only initialize the FileSystem once', function () {
            this.loader.init();

            this.loader.init();

            expect(this.fileSystem.init).to.have.been.calledOnce;
        });

        it('should pass the module factory fetcher through to the FileSystem', function () {
            var moduleFactoryFetcher = sinon.stub();

            this.loader.init(moduleFactoryFetcher);

            expect(this.fileSystem.init).to.have.been.calledWith(sinon.match.same(moduleFactoryFetcher));
        });
    });

    describe('load()', function () {
        it('should return a new factory from [moduleFactory].using(...)', function () {
            var moduleFactory = sinon.stub(),
                newModuleFactory = sinon.stub();
            moduleFactory.using = sinon.stub().returns(newModuleFactory);

            expect(this.loader.load('my/module/path.php', moduleFactory)).to.equal(newModuleFactory);
        });

        it('should pass the path of the module to [moduleFactory].using(...) as an option', function () {
            var moduleFactory = sinon.stub(),
                newModuleFactory = sinon.stub();
            moduleFactory.using = sinon.stub().returns(newModuleFactory);

            this.loader.load('my/module/path.php', moduleFactory);

            expect(moduleFactory.using).to.have.been.calledWith(sinon.match({
                path: 'my/module/path.php'
            }));
        });

        it('should pass the Environment through to [moduleFactory].using(...)', function () {
            var moduleFactory = sinon.stub(),
                newModuleFactory = sinon.stub();
            moduleFactory.using = sinon.stub().returns(newModuleFactory);

            this.loader.load('my/module/path.php', moduleFactory);

            expect(moduleFactory.using).to.have.been.calledWith(
                sinon.match.any,
                sinon.match.same(this.environment)
            );
        });
    });
});
