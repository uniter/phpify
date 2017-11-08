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
    Performance = require('../../src/Performance');

describe('Performance', function () {
    beforeEach(function () {
        this.Date = sinon.stub();
        this.nativePerformance = {
            now: sinon.stub(),
            timing: {
                navigationStart: 21
            }
        };
        this.global = {
            performance: this.nativePerformance
        };
        this.Date.prototype.getTime = sinon.stub();

        this.performance = new Performance(this.Date, this.global);
    });

    describe('getTimeInMicroseconds()', function () {
        it('should return the result from Window.performance.now() + navigationStart where supported', function () {
            // Current time in milliseconds, accurate to the nearest microsecond
            this.nativePerformance.now.returns(1000000);

            expect(this.performance.getTimeInMicroseconds()).to.equal(1000021000);
        });

        it('should return the current time in us rounded to the nearest ms when not supported', function () {
            delete this.global.performance;
            // Current time in milliseconds, accurate to the nearest millisecond
            this.Date.prototype.getTime.returns(12345);

            expect(this.performance.getTimeInMicroseconds()).to.equal(12345000);
        });
    });
});
