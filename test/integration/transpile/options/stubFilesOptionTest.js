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

describe('Transpilation "stubFiles" option integration', function () {
    var outputLog,
        run;

    beforeEach(function () {
        var context = tools.createContext(__dirname + '/../../fixtures/stubFilesOption');

        outputLog = context.outputLog;
        run = context.run;
    });

    // Files may be defined with stubFiles that do not actually exist on disk.
    it('should allow the "stubFiles" option to define stub files in async mode', async function () {
        var modulePath = __dirname + '/../../fixtures/stubFilesOption/my/deep/path/here/entry.php',
            moduleCode = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['stub file exists'] = file_exists(__DIR__ . '/../../../../my/stuff/my_notes.txt');
$result['missing file exists'] = file_exists(__DIR__ . '/../../../../your/stuff/your_notes.txt');

return $result;
EOS
*/;}); // jshint ignore:line

        expect((await run(modulePath, moduleCode)).getNative()).to.deep.equal({
            'stub file exists': true,
            'missing file exists': false
        });
    });
});
