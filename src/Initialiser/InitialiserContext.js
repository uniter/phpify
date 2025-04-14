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
 * Contains the initialiser context data.
 *
 * @constructor
 */
function InitialiserContext() {
    /**
     * @type {Function|null}
     */
    this.bootstrapFetcher = null;
    /**
     * @type {boolean}
     */
    this.loadingBootstraps = false;
}

_.extend(InitialiserContext.prototype, {
    /**
     * Adds zero or more bootstraps to be executed within the environment.
     * Must be done as a separate method call from .installModules(...), as the PHP module factory fetcher
     * function installed needs to be available here, because bootstrap modules may themselves
     * be PHP modules (useful for including Composer's autoloader, for example).
     *
     * @param {Function} bootstrapFetcher
     */
    bootstrap: function (bootstrapFetcher) {
        this.bootstrapFetcher = bootstrapFetcher;
    },

    /**
     * Fetches PHP bootstraps registered by the initialiser.
     *
     * @returns {Function[]}
     */
    getBootstraps: function () {
        var bootstraps,
            context = this;

        if (context.bootstrapFetcher) {
            context.loadingBootstraps = true;
            bootstraps = context.bootstrapFetcher();
            context.loadingBootstraps = false;
        } else {
            bootstraps = [];
        }

        return bootstraps;
    },

    /**
     * Determines whether the initialiser context is currently loading PHP bootstraps.
     *
     * @returns {boolean}
     */
    isLoadingBootstraps: function () {
        return this.loadingBootstraps;
    }
});

module.exports = InitialiserContext;
