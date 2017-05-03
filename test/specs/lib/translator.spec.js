'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const _ = require('lodash');
const translator = require('../../../lib/translator');

describe('Translator', function () {
  describe('translate', function () {
    let rules;
    beforeEach(function () {
      rules = [
        [/<%subject%>/, '{{ subject }}'],
        [/\[Weblink]/g, "{{ Weblink or '' }}"],
        [/\[(Sender_[A-Za-z0-0]+)]/g, "{{ $1 or '' }}"]
      ];
    });

    it('should replace string according to rules', function () {
      expect(translator.translate(rules, 'Hello <%subject%>')).to.be.equal('Hello {{ subject }}');
      expect(translator.translate(rules, 'Hello %subject%')).to.be.equal('Hello %subject%');
      expect(translator.translate(rules, 'Hello #subject#')).to.be.equal('Hello #subject#');
    });

    it('should iterate number of length times', function () {
      let content = new String('Hello <%subject%>')
      content.replace = sinon.stub().returns(content);
      translator.translate(rules, content);
      expect(content.replace.callCount).to.be.equal(3);
    });
  });

  describe('translateCustomDelimited', function(){
    let func = translator.translateCustomDelimited;
    it('should translate delimited tags correctly', function(){
      expect(func('Hello :name:', ':', ':')).to.be.equal('Hello {{ name }}');
      expect(func('Hello :name: (:email:)', ':', ':')).to.be.equal('Hello {{ name }} ({{ email }})');
    });

    it('should translate delimited tags correctly with no ending delimiter', function(){
      expect(func('Hello :name', ':')).to.be.equal('Hello {{ name }}');
      expect(func('Hello :name (:email:)', ':')).to.be.equal('Hello {{ name }} ({{ email }}:)');
    });
  });

});