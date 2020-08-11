/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash');

/**
 * @param {class} Transformer
 * @param {ConfigLoader} phpConfigLoader
 * @param {Object} phpToAST
 * @param {Object} phpToJS
 * @param {Function} resolveRequire
 * @param {Object} globby
 * @param {string} initialiserStubPath
 * @constructor
 */
function TransformerFactory(
    Transformer,
    phpConfigLoader,
    phpToAST,
    phpToJS,
    resolveRequire,
    globby,
    initialiserStubPath
) {
    /**
     * @type {string}
     */
    this.initialiserStubPath = initialiserStubPath;
    /**
     * @type {Object}
     */
    this.globby = globby;
    /**
     * @type {ConfigLoader}
     */
    this.phpConfigLoader = phpConfigLoader;
    /**
     * @type {Object}
     */
    this.phpToAST = phpToAST;
    /**
     * @type {Object}
     */
    this.phpToJS = phpToJS;
    /**
     * @type {Function}
     */
    this.resolveRequire = resolveRequire;
    /**
     * @type {class}
     */
    this.Transformer = Transformer;
}

_.extend(TransformerFactory.prototype, {
    /**
     * Creates a new Transformer for a given context
     *
     * @param {string} contextDirectory The path to the folder webpack.config.js is in, for example
     * @returns {Transformer}
     */
    create: function (contextDirectory) {
        var factory = this,
            uniterConfig = factory.phpConfigLoader.getConfig([contextDirectory]),

            // TODO: Pass effective config path to Transformer and add getter to call from bundler,
            //       so that the config file itself can be added as a dependency for edits to trigger rebuilds

            // Export the config for the PHPCore library rather than attempting to merge it here,
            // as we need to embed any plugin config requires in the Initialiser (see Transformer)
            phpCoreConfig = uniterConfig.exportLibrary('phpcore'),

            phpifyConfig = uniterConfig.getConfigsForLibrary('phpify').mergeUniqueObjects(),
            phpToASTConfig = uniterConfig.getConfigsForLibrary('phpify', 'phptoast').mergeUniqueObjects(),
            phpToJSConfig = uniterConfig.getConfigsForLibrary('phpify', 'phptojs').mergeUniqueObjects(),
            phpParser = factory.phpToAST.create(null, _.extend({'captureAllBounds': true}, phpToASTConfig));

        return new factory.Transformer(
            phpParser,
            factory.phpToJS,
            factory.resolveRequire,
            factory.globby,
            factory.initialiserStubPath,
            phpifyConfig,
            phpToJSConfig,
            phpCoreConfig,
            contextDirectory
        );
    }
});

module.exports = TransformerFactory;
