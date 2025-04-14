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
            bootstraps: [
                // Relative paths should be relative to the uniter.config.js file.
                'bootstrap/first.php',
                // Absolute paths should be used as-is.
                __dirname + '/bootstrap/second.php',
            ],
            include: [
                'my_include.php'
            ]
        },
        phptojs: {
            lineNumbers: true,
            mode: 'async',
        },
    },
};
