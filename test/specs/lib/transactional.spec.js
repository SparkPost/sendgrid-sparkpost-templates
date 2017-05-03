'use strict';

const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const transactional = require('../../../lib/transactional');
const version = require('../../../package.json').version;

describe('Transactional', function () {
  describe('translateText', function () {
    let translateText = transactional.translateText;

    it('should translate <%body%>', function () {
      expect(translateText('<%body%>')).to.be.equal('{{ body }}');
      expect(translateText('<%body%><%body%>')).to.be.equal('{{ body }}<%body%>'); //replace only once
      expect(translateText('<% body %>')).to.be.equal('<% body %>');
    });

    it('should translate <%subject%>', function () {
      expect(translateText('<%subject%>')).to.be.equal('{{ subject }}');
      expect(translateText('<%subject%><%subject%>')).to.be.equal('{{ subject }}<%subject%>'); //replace only once
      expect(translateText('<% subject %>')).to.be.equal('<% subject %>');
    });

    it('should translate global_unsub', function () {
      expect(translateText('<%asm_global_unsubscribe_url%>')).to.be.equal('<a href="?" data-msys-unsubscribe="1">unsubs</a>');

      //multiple occurrences
      let expected = '<a href="?" data-msys-unsubscribe="1">unsubs</a><a href="?" data-msys-unsubscribe="1">unsubs</a>';
      expect(translateText('<%asm_global_unsubscribe_url%><%asm_global_unsubscribe_url%>')).to.be.equal(expected);
    });

    it('should correctly translate mix of tags', function () {
      var expected = '<div>{{ body }}</div>{{ subject }}<a href="?" data-msys-unsubscribe="1">unsubs</a> <p><a href="?" data-msys-unsubscribe="1">unsubs</a></p>';
      expect(translateText('<div><%body%></div><%subject%><%asm_global_unsubscribe_url%> <p><%asm_global_unsubscribe_url%></p>')).to.be.equal(expected);
    });

    describe('custom delimiters', function () {
      let opts;

      beforeEach(function () {
        opts = {
          startingDelimiter: ':',
          endingDelimiter: ':'
        }
      });

      it('should translate with custom delimiter', function () {
        expect(translateText('<%body%> :name:', opts)).to.be.equal('{{ body }} {{ name }}');
        expect(translateText(':name: :email:', opts)).to.be.equal('{{ name }} {{ email }}');
      });

      it('should translate with different delimiter', function () {
        opts = {
          startingDelimiter: '#',
          endingDelimiter: '#'
        };

        expect(translateText('<%body%> #name#', opts)).to.be.equal('{{ body }} {{ name }}');
        expect(translateText(':name: #email#', opts)).to.be.equal(':name: {{ email }}');
        expect(translateText('#name# #email# :email:', opts)).to.be.equal('{{ name }} {{ email }} :email:');
      });


      it('should translate without ending delimiter', function () {
        opts.endingDelimiter = null;
        expect(translateText('<%body%> :name: :email', opts)).to.be.equal('{{ body }} {{ name }}: {{ email }}');
        expect(translateText(':name: :email:', opts)).to.be.equal('{{ name }}: {{ email }}:');
      });

      it('should not translate custom delimiters if not specified', function () {
        opts = {};
        expect(translateText('<%body%> :name: :email', opts)).to.be.equal('{{ body }} :name: :email');
        expect(translateText(':name: :email:', opts)).to.be.equal(':name: :email:');
      });

      it('should not translate with incorrect delimiters', function () {
        opts = {
          startingDelimiter: '-',
          endingDelimiter: '-'
        };

        expect(translateText(':name:', opts)).to.be.equal(':name:');
      });

    });
  });

  describe('translate', function () {
    let translate = transactional.translate
      , sgTemplate, spTemplate, options;

    beforeEach(function () {
      sgTemplate = {
        id: 101,
        name: 'abcd',
        subject: 'Hello :name:',
        html: '<div><%body%></div>',
        text: '<%body%>',
        from: {
          email: 'abc@xyz.com'
        }
      };

      options = {
        startingDelimiter: ':',
        endingDelimiter: ':',
        sandboxDomain: 'sparkpostbox.com'
      };

      spTemplate = {
        id: '101',
        name: 'abcd',
        description: 'Translated by sendgrid2sparkpost ' + version,
        html: '<div>{{ body }}</div>',
        subject: 'Hello {{ name }}',
        text: '{{ body }}',
        from: {
          name: 'Imported',
          email: `imported@sparkpostbox.com`
        }
      };
    });

    it('should translate correctly', function () {
      expect(translate(sgTemplate, options)).to.be.deep.equal(spTemplate);
    });

    it('should throw if sandbox domain not provided', function(){
      expect(function(){
        return translate(sgTemplate);
      }).to.throw(Error, /No sandbox domain/);
    });
  });
});