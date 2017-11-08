/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

/**
 * Performance option wrapper
 *
 * @param {class} Date
 * @param {global} global
 * @constructor
 */
function Performance(Date, global) {
    /**
     * @type {class}
     */
    this.Date = Date;
    /**
     * @type {global}
     */
    this.global = global;
}

_.extend(Performance.prototype, {
    /**
     * Returns the time since the Unix epoch in microseconds
     *
     * @returns {number}
     */
    getTimeInMicroseconds: function () {
        var performance = this;

        if (performance.global.performance) {
            // Use 5-microsecond-precise Performance API, if available
            return (
                performance.global.performance.timing.navigationStart + performance.global.performance.now()
            ) * 1000;
        }

        // Fall back to fake microsecond accuracy (will be correct to the nearest millisecond)
        return new performance.Date().getTime() * 1000;
    }
});

module.exports = Performance;
