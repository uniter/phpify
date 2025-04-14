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
    Environment = require('../src/Environment/Environment'),
    EnvironmentFactory = require('../src/Environment/EnvironmentFactory'),
    EnvironmentProvider = require('../src/Environment/EnvironmentProvider'),
    FileSystem = require('../src/FileSystem'),
    InitialiserContext = require('../src/Initialiser/InitialiserContext'),
    IO = require('../src/IO'),
    Loader = require('../src/Loader'),
    ModuleRepository = require('../src/ModuleRepository'),
    Performance = require('../src/Performance'),
    performance = new Performance(Date, global),
    phpConfigImporter = require('phpconfig').configImporter,
    phpRuntime = require('phpruntime/sync'),
    io = new IO(console),
    environmentFactory = new EnvironmentFactory(Environment),
    environmentProvider = new EnvironmentProvider(environmentFactory, phpRuntime, performance, io),
    initialiserLoader = require('../src/shared/initialiserLoader'),
    api = new API(
        FileSystem,
        Loader,
        ModuleRepository,
        InitialiserContext,
        environmentProvider,
        initialiserLoader,
        phpConfigImporter,
        require.cache
    ),
    loader = api.createLoader();

module.exports = loader;
