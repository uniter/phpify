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
    Performance = require('../../src/Performance');

describe('Performance', function () {
    var Date,
        global,
        nativePerformance,
        performance;

    beforeEach(function () {
        Date = sinon.stub();
        nativePerformance = {
            now: sinon.stub(),
            timing: {
                navigationStart: 21
            }
        };
        global = {
            performance: nativePerformance
        };
        Date.prototype.getTime = sinon.stub();

        performance = new Performance(Date, global);
    });

    describe('getTimeInMicroseconds()', function () {
        it('should return the result from Window.performance.now() + navigationStart where supported', function () {
            // Current time in milliseconds, accurate to the nearest microsecond
            nativePerformance.now.returns(1000000);

            expect(performance.getTimeInMicroseconds()).to.equal(1000021000);
        });

        it('should return the current time in us rounded to the nearest ms when not supported', function () {
            delete global.performance;
            // Current time in milliseconds, accurate to the nearest millisecond
            Date.prototype.getTime.returns(12345);

            expect(performance.getTimeInMicroseconds()).to.equal(12345000);
        });
    });
});
