<?php

/*
 * PHPify - Compiles PHP modules to CommonJS with Uniter
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

print 'second, before sleep' . PHP_EOL;

usleep(1000);

print 'second, after sleep' . PHP_EOL;
