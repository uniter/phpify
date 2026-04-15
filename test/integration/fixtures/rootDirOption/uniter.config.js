/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

module.exports = {
    settings: {
        phpify: {
            // Override the context directory so that paths are resolved relative
            // to this subdirectory rather than the fixture directory itself.
            rootDir: __dirname + '/alt_root',
        },
    },
};
