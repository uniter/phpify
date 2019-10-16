/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

/*global global */
var API = require('../src/API'),
    FileSystem = require('../src/FileSystem'),
    Loader = require('../src/Loader'),
    Performance = require('../src/Performance'),
    performance = new Performance(Date, global),
    phpRuntime = require('phpruntime/psync'),
    api = new API(FileSystem, Loader, phpRuntime, performance),
    loader = api.createLoader();

module.exports = loader;
