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
    InitialiserContext = require('../../../src/Initialiser/InitialiserContext');

describe('InitialiserContext', function () {
    var context;

    beforeEach(function () {
        context = new InitialiserContext();
    });

    describe('bootstrap()', function () {
        it('should store the bootstrap fetcher function', function () {
            var bootstrapFetcher = sinon.stub();

            context.bootstrap(bootstrapFetcher);

            expect(context.bootstrapFetcher).to.equal(bootstrapFetcher);
        });
    });

    describe('getBootstraps()', function () {
        it('should return an empty array when no bootstrap fetcher is set', function () {
            var result = context.getBootstraps();

            expect(result).to.deep.equal([]);
        });

        it('should return the bootstraps from the bootstrap fetcher', function () {
            var bootstraps = ['bootstrap1', 'bootstrap2'],
                bootstrapFetcher = sinon.stub().returns(bootstraps),
                result;

            context.bootstrap(bootstrapFetcher);
            result = context.getBootstraps();

            expect(bootstrapFetcher).to.have.been.calledOnce;
            expect(result).to.equal(bootstraps);
        });

        it('should set loadingBootstraps flag to true while fetching bootstraps', function () {
            var wasLoadingBootstraps = false,
                bootstrapFetcher = sinon.stub().callsFake(function () {
                    wasLoadingBootstraps = context.loadingBootstraps;
                    return [];
                });

            context.bootstrap(bootstrapFetcher);
            context.getBootstraps();

            expect(wasLoadingBootstraps).to.be.true;
            expect(context.loadingBootstraps).to.be.false;
        });
    });

    describe('isLoadingBootstraps()', function () {
        it('should return false by default', function () {
            expect(context.isLoadingBootstraps()).to.be.false;
        });

        it('should return true while bootstraps are being loaded', function () {
            var wasLoadingBootstraps = false,
                bootstrapFetcher = sinon.stub().callsFake(function () {
                    wasLoadingBootstraps = context.isLoadingBootstraps();
                    return [];
                });

            context.bootstrap(bootstrapFetcher);
            context.getBootstraps();

            expect(wasLoadingBootstraps).to.be.true;
            expect(context.isLoadingBootstraps()).to.be.false;
        });
    });
}); 
