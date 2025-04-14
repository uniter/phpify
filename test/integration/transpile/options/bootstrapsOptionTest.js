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

describe('Transpilation "bootstraps" option integration', function () {
    var outputLog,
        run;

    beforeEach(function () {
        var context = tools.createContext(__dirname + '/../../fixtures/asyncBootstraps');

        outputLog = context.outputLog;
        run = context.run;
    });

    it('should allow the "bootstraps" option to provide bootstraps to be awaited in async mode', async function () {
        var modulePath = __dirname + '/../../fixtures/asyncBootstraps/my/deep/path/here/entry.php',
            moduleCode = nowdoc(function () {/*<<<EOS
<?php

print 'inside entrypoint, before include' . PHP_EOL;

include __DIR__ . '/../../../../my_include.php';

print 'inside entrypoint, after include' . PHP_EOL;

return 'done';
EOS
*/;}); // jshint ignore:line

        expect((await run(modulePath, moduleCode)).getNative()).to.equal('done');
        expect(outputLog).to.deep.equal([
            '[info] first, before sleep\n',
            '[info] first, after sleep\n',
            '[info] second, before sleep\n',
            '[info] second, after sleep\n',
            '[info] inside entrypoint, before include\n',
            '[info] inside include, before sleep\n',
            '[info] inside include, after sleep\n',
            '[info] inside entrypoint, after include\n'
        ]);
    });
});
