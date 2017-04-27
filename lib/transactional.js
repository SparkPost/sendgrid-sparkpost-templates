'use strict';
let _ = require('lodash')
  , translator = require('../lib/translator')
  , version = require('../package.json').version,
  rules = [
    [/<%subject%>/, '{{ subject }}'],
    [/<%body%>/, '{{ body }}'],
    [/<%asm_global_unsubscribe_url%>/g, '<a href="?" data-msys-unsubscribe="1">unsubs</a>']
  ];


function translateText(content, opts) {
  content = translator.translate(rules, content);

  if (opts.startingDelimiter) {
    content = translator.translateCustomDelimited(content, opts.startingDelimiter, opts.endingDelimiter);
  }

  return content;
}

function translate(template, opts) {
  let translatedTemplate = {
    id: template.id,
    name: template.name,
    description: 'Translated by sendgrid2sparkpost ' + version
  };

  translatedTemplate.html = translateText(template.html, opts);
  translatedTemplate.text = translateText(template.text, opts);
  translatedTemplate.subject = translateText(template.subject, opts);
  translatedTemplate.from = {
    name: 'Imported',
    email: `imported@${opts.sandboxDomain}`
  };

  return translatedTemplate;

}

module.exports = {
  translateText: translateText,
  translate: translate
};
