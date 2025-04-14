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
            include: [
                'module_1.php',
                'module_2.php',
            ]
        },
        phptojs: {
            lineNumbers: true,
            mode: 'async',
        },
    },
};
