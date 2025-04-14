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
    InitialiserLoader = require('../../../src/Initialiser/InitialiserLoader');

describe('InitialiserLoader', function () {
    var initialiser,
        initialiserLoader,
        initialiserRequirer;

    beforeEach(function () {
        initialiser = function () {};
        initialiserRequirer = sinon.stub().returns(initialiser);
        initialiserLoader = new InitialiserLoader(initialiserRequirer);
    });

    describe('loadInitialiser()', function () {
        it('should call the initialiser requirer function', function () {
            initialiserLoader.loadInitialiser();

            expect(initialiserRequirer).to.have.been.calledOnce;
        });

        it('should return the result of the initialiser requirer', function () {
            expect(initialiserLoader.loadInitialiser()).to.equal(initialiser);
        });
    });

    describe('setRequirer()', function () {
        it('should replace the initialiser requirer', function () {
            var newInitialiser = function () {},
                newInitialiserRequirer = sinon.stub().returns(newInitialiser),
                result;

            initialiserLoader.setRequirer(newInitialiserRequirer);
            result = initialiserLoader.loadInitialiser();

            expect(initialiserRequirer).not.to.have.been.called;
            expect(newInitialiserRequirer).to.have.been.calledOnce;
            expect(result).to.equal(newInitialiser);
        });
    });
}); 
