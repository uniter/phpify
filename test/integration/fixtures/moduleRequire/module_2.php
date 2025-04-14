<?php

/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

$myGlobalVar = 100;

return function () {
    global $myGlobalVar;

    $myGlobalVar += 2;

    return $myGlobalVar;
};
