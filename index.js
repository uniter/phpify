/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var Transformer = require('./src/Transformer'),
    globby = require('globby'),
    path = require('path'),
    phpParser = require('phptoast').create(null, {'captureAllBounds': true}),
    phpToJS = require('phptojs'),
    transformTools = require('browserify-transform-tools'),
    browserFsStubPath = path.resolve(__dirname + '/src/php/browser_fs_stub.php'),
    transformer = new Transformer(phpParser, phpToJS, require.resolve, globby, browserFsStubPath);

module.exports = transformTools.makeStringTransform(
    'phpify',
    {
        // Only transform PHP files
        includeExtensions: ['.php']
    },
    function (content, transformOptions, done) {
        var config = transformOptions.config,
            configDir = transformOptions.configData.configDir,
            file = transformOptions.file;

        if (!config) {
            return done(new Error('Could not find PHPify configuration.'));
        }

        try {
            content = transformer.transform(config, content, file, configDir);
        } catch (error) {
            done(error);
            return;
        }

        done(null, content);
    }
);
