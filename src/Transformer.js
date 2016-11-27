/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var _ = require('microdash'),
    INCLUDE = 'include',
    SYNC = 'sync',
    nowdoc = require('nowdoc'),
    path = require('path');

/**
 * Transforms a PHP module to a CommonJS module suitable for bundling for the browser
 * eg. with Browserify or Webpack
 *
 * @param {Object} phpParser
 * @param {Object} phpToJS
 * @param {Function} resolveRequire
 * @param {Object} globby
 * @constructor
 */
function Transformer(phpParser, phpToJS, resolveRequire, globby) {
    /**
     * @type {null}
     */
    this.entryFile = null;
    /**
     * @type {Object}
     */
    this.globby = globby;
    /**
     * @type {Object}
     */
    this.phpParser = phpParser;
    /**
     * @type {Object}
     */
    this.phpToJS = phpToJS;
    /**
     * @type {Function}
     */
    this.resolveRequire = resolveRequire;
}

_.extend(Transformer.prototype, {
    /**
     * Transforms the specified PHP module code to a CommonJS module
     *
     * @param {Object} config
     * @param {string} content
     * @param {string} file
     * @param {string} configDir
     * @returns {string}
     */
    transform: function (config, content, file, configDir) {
        var transformer = this,
            phpToJSConfig = config.phpToJS || {},
            apiPath = path.dirname(transformer.resolveRequire('phpify')) +
                '/api' +
                (phpToJSConfig[SYNC] ? '/sync' : ''),
            js,
            prefixJS,
            runtimePath = path.dirname(transformer.resolveRequire('phpruntime')),
            suffixJS;

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
                            'sourceContent': content
                        }
                    },
                    phpToJSConfig
                )
            ).replace(/;$/, '');
        }

        function createInit() {
            var globPaths = _.map(phpToJSConfig[INCLUDE] || [], function (path) {
                    return configDir + '/' + path;
                }),
                files = transformer.globby.sync(globPaths),
                phpModuleFactories = [];

            _.each(files, function (filePath) {
                var configRelativePath = path.relative(configDir, filePath),
                    // `./` is required for Browserify to correctly resolve relative paths -
                    // paths starting with no dot or slash, eg. `Demo/file.php` were not being found
                    requirerRelativePath = './' + path.relative(path.dirname(file), filePath);

                phpModuleFactories.push(
                    'case handlePath(' + JSON.stringify(configRelativePath) + '): ' +
                    'return require(' + JSON.stringify(requirerRelativePath) + ');'
                );
            });

            return nowdoc(function () {/*<<<EOS
require(${apiPath}).init(function (path, checkExistence) {
    var exists = false;

    function handlePath(aPath) {
        if (!checkExistence) {
            return aPath;
        }

        if (aPath === path) {
            exists = true;
        }

        return null;
    }

    switch (path) {
    ${switchCases}
    }

    return checkExistence ? exists : null;
});
EOS*/;}, { // jshint ignore:line
        apiPath: JSON.stringify(apiPath),
        switchCases: phpModuleFactories.join('\n    ')
    });
        }

        if (transformer.entryFile === null) {
            transformer.entryFile = file;

            prefixJS = createInit();
        } else {
            prefixJS = 'require(' + JSON.stringify(transformer.entryFile) + ');';
        }

        prefixJS += '\nmodule.exports = require(' +
            JSON.stringify(apiPath) +
            ').load(' +
            JSON.stringify(path.relative(configDir, file)) +
            ', ';
        suffixJS = ');';

        js = compileModule(content, path.relative(configDir, file), prefixJS, suffixJS);

        return js;
    }
});

module.exports = Transformer;
