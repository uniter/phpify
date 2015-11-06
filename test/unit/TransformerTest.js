/*
 * PHPify - Browserify transform
 * Copyright (c) Dan Phillimore (asmblah)
 * https://github.com/uniter/phpify
 *
 * Released under the MIT license
 * https://github.com/uniter/phpify/raw/master/MIT-LICENSE.txt
 */

'use strict';

var expect = require('chai').expect,
    sinon = require('sinon'),
    Transformer = require('../../src/Transformer');

describe('Transformer', function () {
    beforeEach(function () {
        this.config = {};
        this.content = '';
        this.file = '/path/to/my/file.js';
        this.parserState = {
            setPath: sinon.stub()
        };
        this.phpParser = {
            getState: sinon.stub().returns(this.parserState),
            parse: sinon.stub()
        };
        this.phpToJS = {
            transpile: sinon.stub()
        };
        this.transformer = new Transformer(this.phpParser, this.phpToJS);

        this.callTransform = function () {
            return this.transformer.transform(this.config, this.content, this.file);
        }.bind(this);
    });

    it('should return the result from the transpiler', function () {
        this.file = '/my/file.js';
        this.phpParser.parse.withArgs('<?php print "Hello!";')
            .returns({my: 'ast'});
        this.phpToJS.transpile.withArgs({my: 'ast'})
            .returns('(function () { return "transpiler result"; }());');
        this.content = '<?php print "Hello!";';

        expect(this.callTransform()).to.equal('module.exports = (function () { return "transpiler result"; }());');
    });

    it('should pass phpToJS options through to phpToJS', function () {
        this.config.phpToJS = {myOption: 123};

        this.callTransform();

        expect(this.phpToJS.transpile).to.have.been.calledWith(
            sinon.match.any,
            sinon.match({myOption: 123})
        );
    });
});
