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
    tools = require('../tools');

describe('Transpilation paths integration', function () {
    var outputLog,
        run;

    beforeEach(function () {
        var context = tools.createContext(
            // Note that this context directory should be stripped off of all output paths;
            // i.e. all paths should be made relative to it.
            __dirname + '/../../fixtures/a/fake/context_path'
        );

        outputLog = context.outputLog;
        run = context.run;
    });

    it('should resolve module paths correctly in async mode', async function () {
        var modulePath = __dirname + '/../../fixtures/a/fake/context_path/my/deep/path/here/entry.php',
            moduleCode = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['this directory'] = __DIR__;
$result['this file'] = __FILE__;

return $result;
EOS
*/;}); // jshint ignore:line

        expect((await run(modulePath, moduleCode)).getNative()).to.deep.equal({
            'this directory': 'my/deep/path/here',
            'this file': 'my/deep/path/here/entry.php',
        });
    });
});
