/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('lodash'),
    path = require('path');

function Transformer(phpParser, phpToJS, resolveRequire) {
    this.phpParser = phpParser;
    this.phpToJS = phpToJS;
    this.resolveRequire = resolveRequire;
}

Transformer.prototype.transform = function (config, content, file) {
    var transformer = this,
        phpAST,
        js;

    // Tell the parser the path to the current file
    // so it can be included in error messages
    transformer.phpParser.getState().setPath(file);

    phpAST = transformer.phpParser.parse(content);

    js = transformer.phpToJS.transpile(phpAST, _.extend({
        'runtimePath': path.dirname(transformer.resolveRequire('phpruntime'))
    }, config.phpToJS));

    js = 'module.exports = ' + js;

    return js;
};

module.exports = Transformer;
