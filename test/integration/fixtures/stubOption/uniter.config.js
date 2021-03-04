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
                'my/**/*.php',
            ],
            stub: {
                // This module should be stubbed with one that has the following PHP code:
                // (note that to stub with a module that returns a literal string,
                // you will need to use "<?php return 'my string here';")
                'my/stuff/first_polyfill.php': '<?php return 21;',

                // This module should be stubbed with one that returns a number value
                'my/stuff/second_polyfill.php': 12345,

                // This module should be stubbed with one that returns a null value
                'my/stuff/third_polyfill.php': null,
            },
        },
        phptojs: {
            lineNumbers: true,
            mode: 'sync',
        },
    },
};
