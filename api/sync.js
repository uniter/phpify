/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
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
    ModuleRepository = require('../src/ModuleRepository'),
    Performance = require('../src/Performance'),
    performance = new Performance(Date, global),
    phpRuntime = require('phpruntime/sync'),
    api = new API(FileSystem, Loader, ModuleRepository, phpRuntime, performance),
    loader = api.createLoader();

module.exports = loader;
