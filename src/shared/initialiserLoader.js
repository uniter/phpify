/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var InitialiserLoader = require('../Initialiser/InitialiserLoader');

module.exports = new InitialiserLoader(function () {
    return require('../php/initialiser_stub.php');
});
