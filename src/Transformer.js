/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

function Transformer(phpParser, phpToJS) {
    this.phpParser = phpParser;
    this.phpToJS = phpToJS;
}

Transformer.prototype.transform = function (config, content, file) {
    var transformer = this,
        phpAST,
        js;

    // Tell the parser the path to the current file
    // so it can be included in error messages
    transformer.phpParser.getState().setPath(file);

    phpAST = transformer.phpParser.parse(content);

    js = transformer.phpToJS.transpile(phpAST, {
        'runtimePath': require.resolve('phpruntime')
    });

    return js;
};

module.exports = Transformer;
