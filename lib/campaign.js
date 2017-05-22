'use strict';

let _ = require('lodash')
  , parseOneAddress = require('email-addresses').parseOneAddress
  , version = require('../package.json').version
  , translator = require('../lib/translator')
  , generateWarnings = require('./utils').generateWarnings
  , rules = [
    [/\[Sender_(Name|Address|City|State|Zip)]/gi, "{{ Sender_$1 or '' }}"],
    [/\[Unsubscribe]/gi, '<a href="?" data-msys-unsubscribe="1">Unsubscribe</a>'],
    [/\[Unsubscribe_Preferences\]/gi, "{{ Unsubscribe_Preferences or '' }}"],
    [/\[Weblink]/gi, "{{ Weblink or '' }}"],

    /* ORDERS of following rules are IMPORTANT */
    [/\[%email%]/g, "{{ address.email }}"],
    [/\[%([a-zA-Z0-9_]+)%]/g, function (match, fieldName) { //custom field without default value
      return `{{ ${fieldName.trim()} }}`;
    }],
    [/\[%([a-zA-Z0-9_]+)\s+\|(.*[^\s]?)%]/g, function (match, fieldName, defaultValue) { //custom field with default value
      defaultValue = defaultValue.replace(/(^\"|\')|(\"|\'$)/g, "").trim(); //trim beginning/trailing quotes
      return `{{ ${fieldName.trim()} or '${defaultValue}' }}`;
    }]
  ]
  , unsupportedSyntax = [
    [/\[Unsubscribe\]/i, 'Note: [Unsubscribe] tag was translated to &lt;a href="?" data-msys-unsubscribe="1"&gt;...\nRemember to set that href tag correctly.'],
    [/\[Unsubscribe_Preferences\]/i, '[Unsubscribe_Preferences] is unsupported. Treating as a normal substitution variable.']
  ];


function translateText(templateText) {
  let warnings = generateWarnings(templateText, unsupportedSyntax);
  return {
    text: translator.translate(rules, templateText),
    warnings: warnings
  };
}

function getFrom(template, options) {
  let fromName = _.get(template, 'from.name')
    , fromEmail = _.get(template, 'from.email')
    , localPart = _.get(parseOneAddress(fromEmail), 'local', 'imported');

  if (options.useSandboxDomain || !fromEmail) {
    fromEmail = `${localPart}@${options.sandboxDomain}`;
  }

  return {
    name: fromName || localPart,
    email: fromEmail
  }
}

function translate(template, options) {
  let translatedTemplate = {
    id: template.id.toString(),
    name: template.name,
    description: 'Translated by sendgrid2sparkpost ' + version
  }
    , htmlResult
    , textResult
    , subjectResult;

  textResult = translateText(template.text, options);
  htmlResult = translateText(template.html, options);
  subjectResult = translateText(template.subject, options);

  translatedTemplate.html = htmlResult.text;
  translatedTemplate.text = textResult.text;
  translatedTemplate.subject = subjectResult.text;
  translatedTemplate.from = getFrom(template, options);

  return {
    template: translatedTemplate,
    warnings: subjectResult.warnings.concat(htmlResult.warnings, textResult.warnings)
  };
}

module.exports = {
  translateText: translateText,
  translate: translate
};
