/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

/*jshint evil: true */
'use strict';

var expect = require('chai').expect,
    tools = require('./tools');

describe('Transpilation integration', function () {
    it('should transpile a simple PHP file to executable JS in synchronous mode', function () {
        var context = tools.createContext(__dirname + '/fixtures/syncMode');

        expect(context.run('my/entry.php', '<?php return 21;').getNative()).to.equal(21);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "sync" option', async function () {
        var context = tools.createContext(__dirname + '/fixtures/asyncModeViaSyncOption');

        expect((await context.run('my/entry.php', '<?php return 1001;')).getNative()).to.equal(1001);
    });

    it('should transpile a simple PHP file to executable JS in asynchronous mode using the "mode" option', async function () {
        var context = tools.createContext(__dirname + '/fixtures/asyncModeViaModeOption');

        expect((await context.run('my/entry.php', '<?php return 1001;')).getNative()).to.equal(1001);
    });

    it('should transpile a simple PHP file to executable JS in Promise-synchronous mode using the "mode" option', async function () {
        var context = tools.createContext(__dirname + '/fixtures/psyncMode');

        expect((await context.run('my/entry.php', '<?php return 1001;')).getNative()).to.equal(1001);
    });

    it('should allow custom rules to be defined, parsed and transpiled', async function () {
        var context = tools.createContext(__dirname + '/fixtures/customRule');

        expect(context.run('my/entry.php', '<?php return "It is " . §"20mg";').getNative()).to.equal('It is 20mg (approx.)');
    });
});
