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
        it('should always return false for now', function () {
            expect(this.fileSystem.isDirectory('/my/dir/path')).to.be.false;
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

    describe('open()', function () {
        it('should be rejected as Streams are not supported', function () {
            expect(this.fileSystem.open('/my/file.txt')).to.be.rejectedWith(
                'Could not open "/my/file.txt" :: Streams are not currently supported by PHPify'
            );
        });
    });

    describe('openSync()', function () {
        it('should throw as Streams are not supported', function () {
            expect(function () {
                this.fileSystem.openSync('/my/file.txt');
            }.bind(this)).to.throw(
                'Could not open "/my/file.txt" :: Streams are not currently supported by PHPify'
            );
        });
    });

    describe('realPath()', function () {
        it('should resolve any parent directory symbols in the path', function () {
            expect(this.fileSystem.realPath('my/path/../to/a/../mod/u/le/../../file.js'))
                .to.equal('my/to/mod/file.js');
        });

        it('should strip any leading forward-slash', function () {
            expect(this.fileSystem.realPath('/my/path/../to/a/../mod/u/le/../../file.js'))
                .to.equal('my/to/mod/file.js');
        });
    });

    describe('unlink()', function () {
        it('should be rejected as file and folder deletion is currently not supported', function () {
            expect(this.fileSystem.unlink('/my/file.txt')).to.be.rejectedWith(
                'Could not delete "/my/file.txt" :: not currently supported by PHPify'
            );
        });
    });

    describe('unlinkSync()', function () {
        it('should throw as file and folder deletion is currently not supported', function () {
            expect(function () {
                this.fileSystem.unlinkSync('/my/file.txt');
            }.bind(this)).to.throw(
                'Could not delete "/my/file.txt" :: not currently supported by PHPify'
            );
        });
    });
});
