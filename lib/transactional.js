'use strict';
let _ = require('lodash')
  , translator = require('../lib/translator')
  , version = require('../package.json').version
  , rules = [
    [/<%asm_group_unsubscribe_url%>/, '{{asm_group_unsubscribe_url}}'],
    [/<%asm_preferences_url%>/, '{{asm_preferences_url}}'],
    [/<%subject%>/, '{{ subject }}'],
    [/<%body%>/, '{{ body }}'],
    [/<%asm_global_unsubscribe_url%>/g, '<a href="?" data-msys-unsubscribe="1">Unsubscribe</a>']
  ]
  , unsupportedSyntax = [
    [/<%asm_group_unsubscribe_url%>/, "Warning: asm_group_unsubscribe_url tag is unsupported. Treating as a normal substitution variable." ],
    [/<%asm_preferences_url%>/, "Warning: asm_preferences_url tag is unsupported. Treating as a normal substitution variable." ]
  ];

function generateWarnings(content) {
  let foundInContent = unsupportedSyntax.filter(syntax => syntax[0].test(content));
  let warnings = foundInContent.map(result => result[1]);
  return warnings;
}

function translateText(content, opts) {
  let warnings = generateWarnings(content);
  opts = opts || {};
  content = translator.translate(rules, content);

  if (opts.startingDelimiter) {
    content = translator.translateCustomDelimited(content, opts.startingDelimiter, opts.endingDelimiter);
  }

  return {
    text: content,
    warnings: warnings
  };
}

function translate(template, opts) {
  opts = opts || {};
  let translatedTemplate = {
    id: template.id.toString(),
    name: template.name,
    description: 'Translated by sendgrid2sparkpost ' + version
  }
  , textResult
  , htmlResult
  , subjectResult;

  if(!opts.sandboxDomain) {
    throw new Error('No sandbox domain!');
  }

  textResult = translateText(template.text, opts);
  htmlResult = translateText(template.html, opts);
  subjectResult = translateText(template.subject, opts);

  translatedTemplate.html = htmlResult.text;
  translatedTemplate.text = textResult.text;
  translatedTemplate.subject = subjectResult.text;
  translatedTemplate.from = {
    name: 'Imported',
    email: `imported@${opts.sandboxDomain}`
  };

  return {
    template: translatedTemplate,
    warnings: subjectResult.warnings.concat(htmlResult.warnings, textResult.warnings)
  };
}

module.exports = {
  translateText: translateText,
  translate: translate
};
