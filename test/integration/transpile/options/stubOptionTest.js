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

describe('Transpilation "stub" option integration', function () {
    var outputLog,
        run;

    beforeEach(function () {
        var context = tools.createContext(__dirname + '/../../fixtures/stubOption');

        outputLog = context.outputLog;
        run = context.run;
    });

    it('should allow the "stub" option to override files', async function () {
        var modulePath = __dirname + '/../../fixtures/stubOption/my/deep/path/here/entry.php',
            moduleCode = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['stubbed with PHP code string'] = require __DIR__ . '/../../../stuff/first_polyfill.php';
$result['stubbed with number'] = require __DIR__ . '/../../../stuff/second_polyfill.php';
$result['stubbed with null'] = require __DIR__ . '/../../../stuff/third_polyfill.php';

return $result;
EOS
*/;}); // jshint ignore:line

        expect((await run(modulePath, moduleCode)).getNative()).to.deep.equal({
            'stubbed with PHP code string': 21,
            'stubbed with number': 12345,
            'stubbed with null': null
        });
    });
});
