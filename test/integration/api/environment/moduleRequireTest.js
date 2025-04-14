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
    tools = require('../../tools');

describe('API environment module require integration', function () {
    var loader,
        outputLog,
        run;

    beforeEach(function () {
        var context = tools.createContext(__dirname + '/../../fixtures/moduleRequire');

        loader = context.asyncLoader;
        outputLog = context.outputLog;
        run = context.run;
    });

    it('should support multiple separate PHP environments', async function () {
        var environment1 = loader.createEnvironment(),
            environment2 = loader.createEnvironment(),
            closureForEnvironment1 = (await environment1.requireModule('module_1.php')).getNative(),
            closureForEnvironment2 = (await environment2.requireModule('module_2.php')).getNative(),
            resultLog = [];

        resultLog.push(await closureForEnvironment1());
        resultLog.push(await closureForEnvironment2());
        resultLog.push(await closureForEnvironment1());
        resultLog.push(await closureForEnvironment2());

        expect(resultLog).to.deep.equal([
            2,
            102,
            3,
            104
        ]);
    });
});
