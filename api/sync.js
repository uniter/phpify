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
    EnvironmentProvider = require('../src/EnvironmentProvider'),
    FileSystem = require('../src/FileSystem'),
    IO = require('../src/IO'),
    Loader = require('../src/Loader'),
    ModuleRepository = require('../src/ModuleRepository'),
    Performance = require('../src/Performance'),
    performance = new Performance(Date, global),
    phpConfigImporter = require('phpconfig').configImporter,
    phpRuntime = require('phpruntime/sync'),
    io = new IO(console),
    environmentProvider = new EnvironmentProvider(phpRuntime, performance, io),
    api = new API(FileSystem, Loader, ModuleRepository, environmentProvider, phpConfigImporter),
    loader = api.createLoader();

module.exports = loader;
