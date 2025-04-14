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
            stubFiles: {
                // This file should be included in the compiled bundle with the given contents.
                'my/stuff/my_notes.txt': 'These are my plain text notes'
            },
        },
        phptojs: {
            lineNumbers: true,
            mode: 'async',
        },
    },
};
