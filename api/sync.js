/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var API = require('../src/API'),
    FileSystem = require('../src/FileSystem'),
    Loader = require('../src/Loader'),
    phpRuntime = require('phpruntime/sync'),
    api = new API(FileSystem, Loader, phpRuntime),
    loader = api.createLoader();

module.exports = loader;
