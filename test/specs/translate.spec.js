'use strict';

const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const translator = require('../../lib/translate');

describe('translate', function () {
  describe('translateTemplate', function () {

    var sendgridTemplate, options;

    beforeEach(function () {
      sendgridTemplate = {
        subject: 'Hello :name:',
        html: '<div><%body%></div>',
        text: '<%body%>',
        from: {
          email: 'abc@xyz.com'
        }
      };
      options = {
        beginDelimiter: ':',
        endingDelimiter: ':'
      }
    });

    it('should translate sg template correctly', function () {
      var sparkpostTemplate = translator.translateTemplate(sendgridTemplate, options);
      expect(sparkpostTemplate.html).to.be.equal('<div>{{ body }}</div>');
      expect(sparkpostTemplate.text).to.be.equal('{{ body }}');
      expect(sparkpostTemplate.subject).to.be.equal('Hello {{ name }}');
      expect(sparkpostTemplate.from.name).to.be.equal('abc');
      expect(sparkpostTemplate.from.email).to.be.equal('abc@xyz.com');
    });

    it('should not translate custom delimiters if not specified', function () {
      sendgridTemplate.subject = 'Hello :name';
      options = {};
      var sparkpostTemplate = translator.translateTemplate(sendgridTemplate, options);
      expect(sparkpostTemplate.subject).to.be.equal('Hello :name');
    });

    it('should translate without ending delimiter', function () {
      sendgridTemplate.subject = 'Hello :name';
      options.endingDelimiter = null;
      var sparkpostTemplate = translator.translateTemplate(sendgridTemplate, options);
      expect(sparkpostTemplate.subject).to.be.equal('Hello {{ name }}');
    });

    it('should not translate with incorrect delimiters', function () {
      sendgridTemplate.subject = 'Hello :name';
      var sparkpostTemplate = translator.translateTemplate(sendgridTemplate, options);
      expect(sparkpostTemplate.subject).to.be.equal('Hello :name');
    });

    it('should have default from if not specified', function () {
      sendgridTemplate.from = null;

      var sparkpostTemplate = translator.translateTemplate(sendgridTemplate, options);
      expect(sparkpostTemplate.from.name).to.be.equal('imported');
      expect(sparkpostTemplate.from.email).to.be.equal('imported@sparkpostbox.com');
    });

    it('should use sandbox domain in from email when asked to', function () {
      options.useSandboxDomain = true;

      var sparkpostTemplate = translator.translateTemplate(sendgridTemplate, options);
      expect(sparkpostTemplate.from.name).to.be.equal('abc');
      expect(sparkpostTemplate.from.email).to.be.equal('abc@sparkpostbox.com');
    });

    describe('translation', function(){
      var sendgridTemplate, options;

      beforeEach(function () {
        sendgridTemplate = {
          subject: '<%subject%>',
          html: '<div><%body%></div>',
          text: '<%body%>',
          from: {
            email: 'abc@xyz.com'
          }
        };
        options = {}
      });
      function helper(value) {
        var sgTemplateObj = {
          subject: '<%subject%>',
          html: value
        };
        return translator.translateTemplate(sgTemplateObj).html;
      }

      it('should translate <%body%>', function(){
        expect(helper('<%body%>')).to.be.equal('{{ body }}');
        expect(helper('<%body%><%body%>')).to.be.equal('{{ body }}<%body%>');
        expect(helper('<% body %>')).to.be.equal('<% body %>');
      });

      it('should translate global_unsub', function(){
        var expected = '<div>{{ body }}</div><a href="?" data-msys-unsubscribe="1">unsubs</a> <p><a href="?" data-msys-unsubscribe="1">unsubs</a></p>';
        expect(helper('<div><%body%></div><%asm_global_unsubscribe_url%> <p><%asm_global_unsubscribe_url%></p>')).to.be.equal(expected);
      });

      it('should translate sender info', function(){
        var expected = "<p>{{ Sender_Name or '' }}, {{ Sender_City or '' }}, {Sender_City}</p>";
        expect(helper('<p>[Sender_Name], [Sender_City], {Sender_City}</p>')).to.be.equal(expected);
        expect(helper('[Sender_Name], [Sender_Name]')).to.be.equal("{{ Sender_Name or '' }}, {{ Sender_Name or '' }}");
        expect(helper('[Sender_Address]')).to.be.equal("{{ Sender_Address or '' }}");
        expect(helper('[Sender_Zip]')).to.be.equal("{{ Sender_Zip or '' }}");
        expect(helper('[Sender_State]')).to.be.equal("{{ Sender_State or '' }}");
        expect(helper('[Sender_City]')).to.be.equal("{{ Sender_City or '' }}");

      });

      it('should translate weblink correctly', function(){
        expect(helper('<p>[Weblink]</p>')).to.be.equal("<p>{{ Weblink or '' }}</p>");
      });

      it('should translate email correctly', function(){
        expect(helper('<p>[%email%]</p>')).to.be.equal("<p>{{ address.email }}</p>");
      });

      it('should translate custom fields correctly', function(){
        expect(helper('<p>[%abcd%]</p>')).to.be.equal("<p>{{ abcd }}</p>");
        expect(helper("<p>[%abcd | 'val'%]</p>")).to.be.equal("<p>{{ abcd or 'val' }}</p>");
      });

    });

  });
});