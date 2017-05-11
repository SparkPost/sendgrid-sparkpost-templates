'use strict';

const chai = require('chai');
const expect = chai.expect;
const _ = require('lodash');
const campaign = require('../../../lib/campaign');
const version = require('../../../package.json').version;

const unsubsTranslation = '<a href="?" data-msys-unsubscribe="1">Unsubscribe</a>';

describe('Marketing Campaign', function () {
  describe('translateText', function () {

    function translateText(str) {
      return campaign.translateText(str).text;
    }

    it('should produce translated text and a list of warnings', function () {
      let result = campaign.translateText('');
      expect(result).to.have.keys(['text', 'warnings']);
      expect(result.text).to.be.a.string;
      expect(result.warnings).to.be.an.array;
    });

    it('should translate sender fields tags', function () {
      expect(translateText('[Sender_Name]')).to.be.equal("{{ Sender_Name or '' }}");
      expect(translateText('[Sender_Address]')).to.be.equal("{{ Sender_Address or '' }}");
      expect(translateText('[Sender_City]')).to.be.equal("{{ Sender_City or '' }}");
      expect(translateText('[Sender_State]')).to.be.equal("{{ Sender_State or '' }}");
      expect(translateText('[Sender_Zip]')).to.be.equal("{{ Sender_Zip or '' }}");
    });

    it('should translate multiple occurrences sender fields tags', function () {
      expect(translateText('[Sender_Name] [Sender_Name]')).to.be.equal("{{ Sender_Name or '' }} {{ Sender_Name or '' }}");
      expect(translateText('[Sender_Address] [Sender_Address]')).to.be.equal("{{ Sender_Address or '' }} {{ Sender_Address or '' }}");
      expect(translateText('[Sender_City] [Sender_City]')).to.be.equal("{{ Sender_City or '' }} {{ Sender_City or '' }}");
      expect(translateText('[Sender_State] [Sender_State]')).to.be.equal("{{ Sender_State or '' }} {{ Sender_State or '' }}");
      expect(translateText('[Sender_Zip][Sender_Zip]')).to.be.equal("{{ Sender_Zip or '' }}{{ Sender_Zip or '' }}");
    });

    it('should translate Unsubscribe tag', function () {
      expect(translateText('[Unsubscribe]')).to.be.equal(unsubsTranslation);

      //multiples
      let expected = unsubsTranslation + unsubsTranslation;
      expect(translateText('[Unsubscribe][Unsubscribe]')).to.be.equal(expected);
    });

    it('should translate weblink tag', function () {
      expect(translateText('[Weblink]')).to.be.equal("{{ Weblink or '' }}");

      //multiples
      expect(translateText('[Weblink] <p>[Weblink]</p>')).to.be.equal("{{ Weblink or '' }} <p>{{ Weblink or '' }}</p>");
    });

    it('should translate email tag', function () {
      expect(translateText('[%email%]')).to.be.equal("{{ address.email }}");

      //multiples
      expect(translateText('[%email%] [%email%]')).to.be.equal("{{ address.email }} {{ address.email }}");
    });

    it('should translate custom field tag', function () {
      expect(translateText('[%custom_field%]')).to.be.equal("{{ custom_field }}");
      expect(translateText('[%field2%]')).to.be.equal("{{ field2 }}");
      expect(translateText('[%Awesome_Field%]')).to.be.equal("{{ Awesome_Field }}");

      //multiples
      expect(translateText('[%custom_field%][%custom_field%]')).to.be.equal("{{ custom_field }}{{ custom_field }}");
    });


    it('should correctly translate mix of tags', function () {
      let text = "<div>[Sender_Zip]</div>[Unsubscribe] <p>[Unsubscribe]</p>[%custom_field%]; [%with_default | 'default'%]";
      let expected = `<div>{{ Sender_Zip or '' }}</div>${unsubsTranslation} <p>${unsubsTranslation}</p>{{ custom_field }}; {{ with_default or 'default' }}`;
      expect(translateText(text)).to.be.equal(expected);
    });

  });

  describe('translate', function () {
    let sgTemplate, spTemplate, options;

    function translate(str, opts) {
      return campaign.translate(str, opts).template;
    }


    beforeEach(function () {
      sgTemplate = {
        id: 101,
        name: 'abcd',
        subject: '[%Subject | Thank You!%]',
        html: '<div>Hello [%name%], Thanks for signing up. Regards, [Sender_Name]</div>',
        text: 'Hello [%name%], Thanks for signing up. Regards, [Sender_Name]',
        from: {
          email: 'admin@mysite.com'
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
        html: "<div>Hello {{ name }}, Thanks for signing up. Regards, {{ Sender_Name or '' }}</div>",
        text: "Hello {{ name }}, Thanks for signing up. Regards, {{ Sender_Name or '' }}",
        subject: "{{ Subject or 'Thank You!' }}",
        from: {
          name: 'admin',
          email: 'admin@mysite.com'
        }
      };
    });

    it('should translate correctly', function () {
      expect(translate(sgTemplate, options)).to.be.deep.equal(spTemplate);
    });

    it('should use sandbox domain', function () {
      options.useSandboxDomain = true;
      let result = translate(sgTemplate, options);
      expect(result.from).to.deep.equal({name: 'admin', email: 'admin@sparkpostbox.com'});
    });

    it('should use sandbox domain even if not wanted but `from` is not available', function () {
      options.useSandboxDomain = false;
      delete sgTemplate.from;

      let result = translate(sgTemplate, options);
      expect(result.from).to.deep.equal({name: 'imported', email: 'imported@sparkpostbox.com'});
    });


  });
});
