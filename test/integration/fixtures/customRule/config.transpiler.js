/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

module.exports = {
    nodes: {
        // This function will be called for each parsed custom expression AST node
        N_MY_CUSTOM_EXPRESSION: function (node, interpret) {
            return interpret(node.operand) + '.coerceToString().concat(tools.valueFactory.createString(" (approx.)"))';
        },
    },
};
