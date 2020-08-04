/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

/*
 * Transform API: used by the Webpack loader, Babel plugin etc.
 */

var Transformer = require('./src/Transformer'),
    TransformerFactory = require('./src/TransformerFactory'),
    fs = require('fs'),
    globby = require('globby'),
    path = require('path'),
    phpConfigLoader = require('phpconfig').createConfigLoader(fs.existsSync),
    phpToAST = require('phptoast'),
    phpToJS = require('phptojs'),
    initialiserStubPath = path.resolve(__dirname + '/src/php/initialiser_stub.php'),
    transformerFactory = new TransformerFactory(
        Transformer,
        phpConfigLoader,
        phpToAST,
        phpToJS,
        require.resolve,
        globby,
        initialiserStubPath
    );

module.exports = transformerFactory;
