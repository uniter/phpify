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
    EventEmitter = require('events').EventEmitter,
    IO = require('../../src/IO');

describe('IO', function () {
    var console,
        environment,
        io,
        phpifyConfig,
        phpStderr,
        phpStdout;

    beforeEach(function () {
        console = {
            info: sinon.stub(),
            warn: sinon.stub()
        };
        phpifyConfig = {
            stdio: true
        };
        phpStderr = new EventEmitter();
        phpStdout = new EventEmitter();
        environment = {
            getStderr: sinon.stub().returns(phpStderr),
            getStdout: sinon.stub().returns(phpStdout)
        };

        io = new IO(console);
    });

    describe('install()', function () {
        describe('when the console is available and stdio is enabled', function () {
            it('should install a listener that copies data from the PHP stdout to the console', function () {
                io.install(environment, phpifyConfig);

                phpStdout.emit('data', 'some output');

                expect(console.info).to.have.been.calledOnce;
                expect(console.info).to.have.been.calledWith('some output');
                expect(console.warn).not.to.have.been.called;
            });

            it('should install a listener that copies data from the PHP stderr to the console', function () {
                io.install(environment, phpifyConfig);

                phpStderr.emit('data', 'Bang! Something went wrong');

                expect(console.warn).to.have.been.calledOnce;
                expect(console.warn).to.have.been.calledWith('Bang! Something went wrong');
                expect(console.info).not.to.have.been.called;
            });

            it('should install a stdout listener onto each different one provided', function () {
                var secondPhpStderr = new EventEmitter(),
                    secondPhpStdout = new EventEmitter(),
                    secondEnvironment = {
                        getStdout: sinon.stub().returns(secondPhpStdout),
                        getStderr: sinon.stub().returns(secondPhpStderr),
                    };
                io.install(environment, phpifyConfig);
                io.install(secondEnvironment, phpifyConfig);

                phpStdout.emit('data', 'first output');
                secondPhpStdout.emit('data', 'second output');

                expect(console.info).to.have.been.calledTwice;
                expect(console.info).to.have.been.calledWith('first output');
                expect(console.info).to.have.been.calledWith('second output');
                expect(console.warn).not.to.have.been.called;
            });

            it('should install a stderr listener onto each different one provided', function () {
                var secondPhpStderr = new EventEmitter(),
                    secondPhpStdout = new EventEmitter(),
                    secondEnvironment = {
                        getStdout: sinon.stub().returns(secondPhpStdout),
                        getStderr: sinon.stub().returns(secondPhpStderr),
                    };
                io.install(environment, phpifyConfig);
                io.install(secondEnvironment, phpifyConfig);

                phpStderr.emit('data', 'first warning');
                secondPhpStderr.emit('data', 'second warning');

                expect(console.warn).to.have.been.calledTwice;
                expect(console.warn).to.have.been.calledWith('first warning');
                expect(console.warn).to.have.been.calledWith('second warning');
                expect(console.info).not.to.have.been.called;
            });
        });

        describe('when the console is unavailable', function () {
            beforeEach(function () {
                io = new IO(null);
            });

            it('should not install a listener that copies data from the PHP stdout', function () {
                io.install(environment, phpifyConfig);

                phpStdout.emit('data', 'some output');

                expect(console.info).not.to.have.been.called;
                expect(console.warn).not.to.have.been.called;
            });

            it('should install a listener that copies data from the PHP stderr', function () {
                io.install(environment, phpifyConfig);

                phpStderr.emit('data', 'Bang! Something went wrong');

                expect(console.info).not.to.have.been.called;
                expect(console.warn).not.to.have.been.called;
            });
        });

        describe('when stdio is disabled in config', function () {
            beforeEach(function () {
                phpifyConfig.stdio = false;
            });

            it('should not install a listener that copies data from the PHP stdout', function () {
                io.install(environment, phpifyConfig);

                phpStdout.emit('data', 'some output');

                expect(console.info).not.to.have.been.called;
                expect(console.warn).not.to.have.been.called;
            });

            it('should install a listener that copies data from the PHP stderr', function () {
                io.install(environment, phpifyConfig);

                phpStderr.emit('data', 'Bang! Something went wrong');

                expect(console.info).not.to.have.been.called;
                expect(console.warn).not.to.have.been.called;
            });
        });
    });
});
