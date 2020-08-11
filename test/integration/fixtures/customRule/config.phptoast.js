/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

module.exports = {
    rules: {
        // Define a rule for our custom expression (but it won't do anything unless it is
        // referenced somewhere from the main program rule tree in the grammar - see below)
        'N_MY_CUSTOM_EXPRESSION': {
            components: [
                /§/,
                {name: 'operand', rule: 'N_EXPRESSION_LEVEL_0'},
            ],
        },

        'N_EXPRESSION_LEVEL_0': {
            components: {
                // Add the new expression type at the lowest precedence level
                oneOf: ['N_MY_CUSTOM_EXPRESSION', 'N_EXPRESSION_LEVEL_0'],
            },
        },
    },
};
