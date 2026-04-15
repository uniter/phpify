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

describe('Transpilation "rootDir" option integration', function () {
    var run;

    beforeEach(function () {
        var context = tools.createContext(__dirname + '/../../fixtures/rootDirOption');

        run = context.run;
    });

    it('should resolve module paths relative to rootDir rather than the context directory', async function () {
        // The fixture config sets rootDir to the alt_root/ subdirectory,
        // so paths should be relative to that rather than the fixture directory itself.
        // Without rootDir, __FILE__ would be "alt_root/my/module.php".
        var modulePath = __dirname + '/../../fixtures/rootDirOption/alt_root/my/module.php',
            moduleCode = nowdoc(function () {/*<<<EOS
<?php

$result = [];

$result['this directory'] = __DIR__;
$result['this file'] = __FILE__;

return $result;
EOS
*/;}); // jshint ignore:line

        expect((await run(modulePath, moduleCode)).getNative()).to.deep.equal({
            'this directory': 'my',
            'this file': 'my/module.php',
        });
    });
});
