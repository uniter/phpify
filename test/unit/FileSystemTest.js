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
    FileSystem = require('../../src/FileSystem');

describe('FileSystem', function () {
    beforeEach(function () {
        this.phpModuleFactoryFetcher = sinon.stub();

        this.fileSystem = new FileSystem();
        this.fileSystem.init(this.phpModuleFactoryFetcher);
    });

    describe('compilePHPFile()', function () {
        it('should return the module factory from the fetcher after resolving the path when it exists', function () {
            var moduleFactory = sinon.stub();
            this.phpModuleFactoryFetcher.withArgs('my/module/path.php', false).returns(moduleFactory);

            expect(this.fileSystem.compilePHPFile('my/module/in/here/../../path.php')).to.equal(moduleFactory);
        });

        it('should throw an error when the module does not exist', function () {
            this.phpModuleFactoryFetcher.returns(null);

            expect(function () {
                this.fileSystem.compilePHPFile('my/module/in/here/../../path.php');
            }.bind(this)).to.throw('File "my/module/path.php" is not in the compiled PHP file map');
        });
    });

    describe('isDirectory()', function () {
        it('should always return true', function () {
            expect(this.fileSystem.isDirectory('/my/dir/path')).to.be.true;
        });
    });

    describe('isFile()', function () {
        it('should return true when a compiled PHP module exists with the given path', function () {
            this.phpModuleFactoryFetcher.withArgs('my/module/path.php', true).returns(true);

            expect(this.fileSystem.isFile('my/module/in/here/../../path.php')).to.be.true;
        });

        it('should return false when no compiled PHP module exists with the given path', function () {
            this.phpModuleFactoryFetcher.withArgs('my/module/path.php', true).returns(false);

            expect(this.fileSystem.isFile('my/module/in/here/../../path.php')).to.be.false;
        });
    });

    describe('realPath()', function () {
        it('should resolve any parent directory symbols in the path', function () {
            expect(this.fileSystem.realPath('my/path/../to/a/../mod/u/le/../../file.js'))
                .to.equal('my/to/mod/file.js');
        });
    });
});
