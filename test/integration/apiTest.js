/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var asyncAPI = require('../../api/async'),
    expect = require('chai').expect,
    phpify = require('../..'),
    psyncAPI = require('../../api/psync'),
    syncAPI = require('../../api/sync'),
    Loader = require('../../src/Loader'),
    TransformerFactory = require('../../src/TransformerFactory');

describe('Public API integration', function () {
    it('should export a TransformerFactory as the transformation API', function () {
        expect(phpify).to.be.an.instanceOf(TransformerFactory);
    });

    it('should export a Loader as the async API entrypoint', function () {
        expect(asyncAPI).to.be.an.instanceOf(Loader);
    });

    it('should export a Loader as the sync API entrypoint', function () {
        expect(syncAPI).to.be.an.instanceOf(Loader);
    });

    it('should export a Loader as the psync API entrypoint', function () {
        expect(psyncAPI).to.be.an.instanceOf(Loader);
    });
});
