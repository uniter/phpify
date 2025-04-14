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
    EnvironmentFactory = require('../../../src/Environment/EnvironmentFactory'),
    InitialiserContext = require('../../../src/Initialiser/InitialiserContext');

describe('EnvironmentFactory', function () {
    var Environment,
        environmentFactory,
        environmentInstance,
        initialiserContext,
        moduleRepository,
        phpCoreEnvironment;

    beforeEach(function () {
        environmentInstance = {};
        Environment = sinon.stub().returns(environmentInstance);
        initialiserContext = sinon.createStubInstance(InitialiserContext);
        moduleRepository = {};
        phpCoreEnvironment = {};

        environmentFactory = new EnvironmentFactory(Environment);
    });

    describe('createEnvironment()', function () {
        it('should create an instance of Environment with the provided dependencies', function () {
            var result = environmentFactory.createEnvironment(
                moduleRepository,
                initialiserContext,
                phpCoreEnvironment
            );

            expect(Environment).to.have.been.calledOnce;
            expect(Environment).to.have.been.calledWith(
                sinon.match.same(moduleRepository),
                sinon.match.same(initialiserContext),
                sinon.match.same(phpCoreEnvironment)
            );
            expect(result).to.equal(environmentInstance);
        });
    });
});
