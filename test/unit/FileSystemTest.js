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
    FileSystem = require('../../src/FileSystem'),
    ModuleRepository = require('../../src/ModuleRepository');

describe('FileSystem', function () {
    var fileSystem,
        moduleRepository;

    beforeEach(function () {
        moduleRepository = sinon.createStubInstance(ModuleRepository);

        fileSystem = new FileSystem(moduleRepository);
    });

    describe('getModuleFactory()', function () {
        it('should return the module factory from the repository after resolving the path', function () {
            var moduleFactory = sinon.stub();
            moduleRepository.getModuleFactory
                .withArgs('my/module/path.php')
                .returns(moduleFactory);

            expect(fileSystem.getModuleFactory('my/module/in/here/../../path.php')).to.equal(moduleFactory);
        });
    });

    describe('isDirectory()', function () {
        it('should always return false for now', function () {
            expect(fileSystem.isDirectory('/my/dir/path')).to.be.false;
        });
    });

    describe('isFile()', function () {
        it('should return true when a PHP module exists with the given path', function () {
            moduleRepository.moduleExists
                .withArgs('my/module/path.php')
                .returns(true);

            expect(fileSystem.isFile('my/module/in/here/../../path.php')).to.be.true;
        });

        it('should return false when no PHP module exists with the given path', function () {
            moduleRepository.moduleExists
                .withArgs('my/module/path.php')
                .returns(false);

            expect(fileSystem.isFile('my/module/in/here/../../path.php')).to.be.false;
        });
    });

    describe('open()', function () {
        it('should be rejected as Streams are not supported', function () {
            expect(fileSystem.open('/my/file.txt')).to.be.rejectedWith(
                'Could not open "/my/file.txt" :: Streams are not currently supported by PHPify'
            );
        });
    });

    describe('openSync()', function () {
        it('should throw as Streams are not supported', function () {
            expect(function () {
                fileSystem.openSync('/my/file.txt');
            }).to.throw(
                'Could not open "/my/file.txt" :: Streams are not currently supported by PHPify'
            );
        });
    });

    describe('realPath()', function () {
        it('should resolve any parent directory symbols in the path', function () {
            expect(fileSystem.realPath('my/path/../to/a/../mod/u/le/../../file.js'))
                .to.equal('my/to/mod/file.js');
        });

        it('should strip any leading forward-slash', function () {
            expect(fileSystem.realPath('/my/path/../to/a/../mod/u/le/../../file.js'))
                .to.equal('my/to/mod/file.js');
        });
    });

    describe('unlink()', function () {
        it('should be rejected as file and folder deletion is currently not supported', function () {
            expect(fileSystem.unlink('/my/file.txt')).to.be.rejectedWith(
                'Could not delete "/my/file.txt" :: not currently supported by PHPify'
            );
        });
    });

    describe('unlinkSync()', function () {
        it('should throw as file and folder deletion is currently not supported', function () {
            expect(function () {
                fileSystem.unlinkSync('/my/file.txt');
            }).to.throw(
                'Could not delete "/my/file.txt" :: not currently supported by PHPify'
            );
        });
    });

    describe('writeFile()', function () {
        it('should allow files to be detected by isFile()', function () {
            fileSystem.writeFile('my/file.txt', 'contents');

            expect(fileSystem.isFile('my/file.txt')).to.be.true;
        });

        it('should allow files to be overwritten and still detected', function () {
            fileSystem.writeFile('my/file.txt', 'original contents');
            fileSystem.writeFile('my/file.txt', 'new contents');

            expect(fileSystem.isFile('my/file.txt')).to.be.true;
        });

        it('should not affect detection of PHP modules', function () {
            moduleRepository.moduleExists
                .withArgs('my/module.php')
                .returns(true);

            fileSystem.writeFile('my/module.php', 'some contents');

            expect(fileSystem.isFile('my/module.php')).to.be.true;
        });

        it('should not affect detection of non-existent files in other paths', function () {
            moduleRepository.moduleExists
                .withArgs('nonexistent/file.txt')
                .returns(false);

            fileSystem.writeFile('my/file.txt', 'contents');

            expect(fileSystem.isFile('nonexistent/file.txt')).to.be.false;
        });

        it('should not affect detection of non-existent files in parent directories', function () {
            moduleRepository.moduleExists
                .withArgs('../other/file.txt')
                .returns(false);

            fileSystem.writeFile('my/file.txt', 'contents');

            expect(fileSystem.isFile('../other/file.txt')).to.be.false;
        });

        it('should not affect detection of non-existent PHP modules', function () {
            moduleRepository.moduleExists
                .withArgs('nonexistent/module.php')
                .returns(false);

            fileSystem.writeFile('my/other.php', 'some contents');

            expect(fileSystem.isFile('nonexistent/module.php')).to.be.false;
        });
    });
});
