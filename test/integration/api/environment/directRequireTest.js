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
    nowdoc = require('nowdoc'),
    tools = require('../../tools');

describe('API environment direct require integration', function () {
    var outputLog,
        run;

    beforeEach(function () {
        var context = tools.createContext(__dirname + '/../../fixtures/a/fake/context_path');

        outputLog = context.outputLog;
        run = context.run;
    });

    it('should support reusing the same PHP environment', async function () {
        var modulePath1 = '/path/to/my_module1.php',
            moduleCode1 = nowdoc(function () {/*<<<EOS
<?php

$myGlobalVar = 1; // Will be overwritten when module 2 is executed.

return function () {
    global $myGlobalVar;

    $myGlobalVar++;

    return $myGlobalVar;
};
EOS
*/;}), // jshint ignore:line
            modulePath2 = '/path/to/my_module2.php',
            moduleCode2 = nowdoc(function () {/*<<<EOS
<?php

$myGlobalVar = 100;

return function () {
    global $myGlobalVar;

    $myGlobalVar += 2;

    return $myGlobalVar;
};
EOS
*/;}), // jshint ignore:line
            closureForEnvironment1 = (await run(modulePath1, moduleCode1)).getNative(),
            closureForEnvironment2 = (await run(modulePath2, moduleCode2)).getNative(),
            resultLog = [];

        resultLog.push(await closureForEnvironment1());
        resultLog.push(await closureForEnvironment2());
        resultLog.push(await closureForEnvironment1());
        resultLog.push(await closureForEnvironment2());

        expect(resultLog).to.deep.equal([
            101,
            103,
            104,
            106
        ]);
    });
});
