'use strict';

let _ = require('lodash')
  , parseOneAddress = require('email-addresses').parseOneAddress
  , version = require('../package.json').version
  , translator = require('../lib/translator')
  , rules = [
  [/\[(Sender_[A-Za-z0-0]+)]/g, "{{ $1 or '' }}"],
  //[/\[Sender_Name]/g, "{{ Sender_Name or '' }}"],
  //[/\[Sender_Address]/g, "{{ Sender_Address or '' }}"],
  //[/\[Sender_City]/g, "{{ Sender_City or '' }}"],
  //[/\[Sender_State]/g, "{{ Sender_State or '' }}"],
  //[/\[Sender_Zip]/g, "{{ Sender_Zip or '' }}"],
  [/\[Unsubscribe]/g, '<a href="?" data-msys-unsubscribe="1">unsubs</a>'],
  [/\[Weblink]/g, "{{ Weblink or '' }}"],

  /* ORDERS of following rules are IMPORTANT */
  [/\[%email%]/g, "{{ address.email }}"],
  [/\[%([a-zA-Z0-9_]+)%]/g, function (match, fieldName) { //custom field without default value
    return `{{ ${fieldName.trim()} }}`;
  }],
  [/\[%([a-zA-Z0-9_]+)\s+\|(.*[^\s]?)%]/g, function (match, fieldName, defaultValue) { //custom field with default value
    defaultValue = defaultValue.replace(/(^\"|\')|(\"|\'$)/g, "").trim(); //trim beginning/trailing quotes
    return `{{ ${fieldName.trim()} or '${defaultValue}' }}`;
  }]
];


function translateText(templateText) {
  return translator.translate(rules, templateText)
}

function translate(template, options) {
  let sandboxEmail = `imported@${options.sandboxDomain}`
    , fromEmail = options.useSandboxDomain ? sandboxEmail : _.get(template, 'from.email', sandboxEmail)
    , localPart = _.get(parseOneAddress(fromEmail), 'local')
    , translatedTemplate = {
    id: template.id.toString(),
    name: template.name,
    description: 'Translated by sendgrid2sparkpost ' + version
  };

  translatedTemplate.html = translateText(template.html);
  translatedTemplate.text = translateText(template.text);
  translatedTemplate.subject = translateText(template.subject);
  translatedTemplate.from = {
    name: _.get(template, 'from.name', localPart),
    email: fromEmail
  };

  return translatedTemplate;
}

module.exports = {
  translateText: translateText,
  translate: translate
};
