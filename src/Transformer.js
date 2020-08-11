/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    BOOTSTRAPS = 'bootstraps',
    INCLUDE = 'include',
    MODE = 'mode',
    SYNC = 'sync',
    nowdoc = require('nowdoc'),
    path = require('path');

/**
 * Transforms a PHP module to a CommonJS module suitable for bundling for the browser or Node.js
 * eg. with Browserify or Webpack
 *
 * @param {Object} phpParser
 * @param {Object} phpToJS
 * @param {Function} resolveRequire
 * @param {Object} globby
 * @param {string} initialiserStubPath
 * @param {Object} phpifyConfig
 * @param {Object} phpToJSConfig
 * @param {Object} transpilerConfig
 * @param {LibraryConfigShape} phpCoreConfig
 * @param {string} contextDirectory
 * @constructor
 */
function Transformer(
    phpParser,
    phpToJS,
    resolveRequire,
    globby,
    initialiserStubPath,
    phpifyConfig,
    phpToJSConfig,
    transpilerConfig,
    phpCoreConfig,
    contextDirectory
) {
    /**
     * @type {string}
     */
    this.contextDirectory = contextDirectory;
    /**
     * @type {Object}
     */
    this.globby = globby;
    /**
     * @type {string}
     */
    this.initialiserStubPath = initialiserStubPath;
    /**
     * @type {LibraryConfigShape}
     */
    this.phpCoreConfig = phpCoreConfig;
    /**
     * @type {Object}
     */
    this.phpifyConfig = phpifyConfig;
    /**
     * @type {Object}
     */
    this.phpParser = phpParser;
    /**
     * @type {Object}
     */
    this.phpToJS = phpToJS;
    /**
     * @type {Object}
     */
    this.phpToJSConfig = phpToJSConfig;
    /**
     * @type {Function}
     */
    this.resolveRequire = resolveRequire;
    /**
     * @type {Object}
     */
    this.transpilerConfig = transpilerConfig;
}

_.extend(Transformer.prototype, {
    /**
     * Transforms the specified PHP module code to a CommonJS module
     *
     * @param {string} content
     * @param {string} file
     * @returns {{code: string, map: object}}
     */
    transform: function (content, file) {
        var transformer = this,
            mode = transformer.phpToJSConfig[SYNC] === true ?
                'sync' :
                (transformer.phpToJSConfig[MODE] || 'async'),
            apiPath = path.dirname(transformer.resolveRequire('phpify')) +
                '/api' +
                (mode === 'async' ? '' : '/' + mode),
            prefixJS,
            runtimePath = path.dirname(transformer.resolveRequire('phpruntime')),
            suffixJS;

        /**
         * Performs the actual compilation of a module, unless it was the initialiser module
         *
         * @param {string} content
         * @param {string} filePath
         * @param {string} prefix
         * @param {string} suffix
         * @return {{code: string, map: Object}} CommonJS output from PHPToJS and PHP->JS source map data
         */
        function compileModule(content, filePath, prefix, suffix) {
            var phpAST;

            // Tell the parser the path to the current file
            // so it can be included in error messages
            transformer.phpParser.getState().setPath(filePath);

            phpAST = transformer.phpParser.parse(content);

            return transformer.phpToJS.transpile(
                phpAST,
                _.extend(
                    {
                        'path': filePath,
                        'runtimePath': runtimePath,
                        'prefix': prefix,
                        'suffix': suffix,
                        'sourceMap': {
                            // Keep the source map data as a separate object and return it to us,
                            // rather than generating a source map comment with it inside,
                            // so that we can much more efficiently just pass it along to Webpack (for example)
                            'returnMap': true,

                            'sourceContent': content
                        }
                    },
                    transformer.phpToJSConfig
                ),
                // Any custom rules etc. will need to be specified here instead
                transformer.transpilerConfig
            );
        }

        /**
         * The initialiser is required by all modules. It will only execute once (as with all
         * CommonJS modules that are not cleared from require.cache) but configures the runtime
         * with the virtual FS containing all bundled PHP modules and any bootstraps.
         *
         * @return {string}
         */
        function buildInitialiser() {
            var bootstraps = transformer.phpifyConfig[BOOTSTRAPS] || [],
                globPaths = _.map(transformer.phpifyConfig[INCLUDE] || [], function (path) {
                    if (/^!/.test(path)) {
                        // Keep the exclamation mark (which marks paths to exclude)
                        // at the beginning of the string
                        return '!' + transformer.contextDirectory + '/' + path.substr(1);
                    }

                    return transformer.contextDirectory + '/' + path;
                }),
                files = transformer.globby.sync(globPaths),
                phpModuleFactories = [];

            _.each(files, function (filePath) {
                var contextRelativePath = path.relative(transformer.contextDirectory, filePath),
                    // `./` is required for Browserify/Webpack to correctly resolve relative paths -
                    // paths starting with no dot or slash, eg. `Demo/file.php` were not being found
                    initialiserRelativePath = './' + path.relative(path.dirname(file), filePath);

                phpModuleFactories.push(
                    'case handlePath(' + JSON.stringify(contextRelativePath) + '): ' +
                    'return require(' + JSON.stringify(initialiserRelativePath) + ');'
                );
            });

            return nowdoc(function () {/*<<<EOS
require(${apiPath}).installModules(function (path, checkExistence) {
    var exists = false;

    function handlePath(aPath) {
        if (!checkExistence) {
            return aPath;
        }

        if (aPath === path) {
            exists = true;
        }

        // Return something that should not match with the path variable,
        // so that the case itself is not executed and we eventually
        // reach the return after the end of the switch
        return null;
    }

    switch (path) {
    ${switchCases}
    }

    return checkExistence ? exists : null;
})${configureCall}${bootstrapCall};
EOS*/;}, { // jshint ignore:line
                apiPath: JSON.stringify(apiPath),
                bootstrapCall:
                    // Optionally add a call to Loader.bootstrap(...) to install the bootstrap
                    // modules if any have been specified
                    bootstraps.length > 0 ?
                        '\n.bootstrap([' +
                        bootstraps
                            .map(function (bootstrapPath) {
                                // Bootstrap paths should be resolved relative to the initialiser
                                var initialiserRelativeBootstrapPath = './' + path.relative(path.dirname(file), bootstrapPath);

                                // NB: ./ is required by bundlers
                                return 'require(' + JSON.stringify(initialiserRelativeBootstrapPath) + ')';
                            })
                            .join(', ') +
                        '])' :
                        '',
                configureCall: '\n.configure(' +
                    JSON.stringify({
                        stdio: transformer.phpifyConfig.stdio !== false
                    }) +
                    ', [' +
                    transformer.phpCoreConfig.pluginConfigFilePaths
                        .map(function (path) {
                            return 'require(' + JSON.stringify(path) + ')';
                        })
                        .concat([JSON.stringify(transformer.phpCoreConfig.topLevelConfig)])
                        .join(', ') +
                    '])',
                switchCases: phpModuleFactories.join('\n    ')
            });
        }

        if (file === transformer.initialiserStubPath) {
            // The included module is the initialiser: output the virtual FS switch() and other config
            // as its only contents. It will be required by every other transformed PHP file,
            // so that they have access to the virtual FS (see below).
            // Doing it this way keeps the transformer stateless, which is needed for HappyPack support.
            return {
                code: buildInitialiser(),

                // No source map to return for the initialiser stub
                map: null
            };
        }

        prefixJS = 'require(' + JSON.stringify(transformer.initialiserStubPath) + ');' +
            '\nmodule.exports = require(' +
            JSON.stringify(apiPath) +
            ').load(' +
            JSON.stringify(path.relative(transformer.contextDirectory, file)) +
            ', ';
        suffixJS = ');';

        return compileModule(content, path.relative(transformer.contextDirectory, file), prefixJS, suffixJS);
    }
});

module.exports = Transformer;
