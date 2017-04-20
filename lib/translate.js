'use strict';
var _ = require('lodash')
  , parseOneAddress = require('email-addresses').parseOneAddress
  , version = require('../package.json').version;

var translationRules = [
  //transactional template
  [/<%subject%>/, '{{ subject }}'],
  [/<%body%>/, '{{ body }}'],
  [/<%asm_global_unsubscribe_url%>/g, '<a href="?" data-msys-unsubscribe="1">unsubs</a>'],
  //
  ////marketing templates
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

/**
 * Find custom delimited substitution tags. They can be like :tag:, %tag%, #tag# or :tag. It can't contain spaces
 * We'll respect one type at a time.
 * In case :tag, we'll find until word boundary.
 * Valid chars: alphanum, _ (underscore), - (dash)
 * @param content
 * @param substitutions
 * @returns {*}
 */
function translateCustomDelimited(content, opts) {
  if (_.isEmpty(opts)) {
    return content;
  }

  let delimiterRegex;
  //Todo: Fix replacing ::tag (with :{{ tag }}) or ::tag:: (with :{{ tag }}: )
  if (opts.endingDelimiter) {
    delimiterRegex = new RegExp(`(\\${opts.beginDelimiter}{1}(\\w+)\\${opts.endingDelimiter}{1})`, 'gi');
  } else {
    delimiterRegex = new RegExp(`(\\${opts.beginDelimiter}{1}(\\w+))`, 'gi');
  }

  //console.log(delimiterRegex);

  content = content.replace(delimiterRegex, (match, nameWithDelimiter, nameWithoutDelimeter) => {
    return `{{ ${nameWithoutDelimeter} }}`;
  });

  return content;
}

function translateContent(content, options) {
  _.each(translationRules, function (rule) {
    content = content.replace(rule[0], rule[1]);
  });

  content = translateCustomDelimited(content, options);

  return content;
}

function translateTemplate(sendgridTemplate, options) {
  var opts = options || {}
    , useSandboxDomain = opts.useSandboxDomain || false
    , sandboxDomain = process.env.SPARKPOST_SANDBOX_DOMAIN || 'sparkpostbox.com'
    , fromEmail = _.get(sendgridTemplate, 'from.email', null)
    , localPart = _.get(parseOneAddress(fromEmail), 'local', 'imported') // Default value
    , html
    , text;


  // Translate HTML and text parts
  if (sendgridTemplate.html) {
    html = translateContent(sendgridTemplate.html, opts);
  }

  if (sendgridTemplate.text) {
    text = translateContent(sendgridTemplate.text, opts);
  }

  if (useSandboxDomain || !fromEmail) {
    fromEmail = `${localPart}@${sandboxDomain}`;
  }

  // Format as SparkPost template structure
  return {
    id: sendgridTemplate.id,
    name: sendgridTemplate.name,
    html: html,
    text: text,
    subject: translateContent(sendgridTemplate.subject, opts),
    from: {
      name: _.get(sendgridTemplate, 'from.name', localPart),
      email: fromEmail
    },
    description: 'Translated by sendgrid2sparkpost ' + version
  };
}

function errorResponse(err, res) {
  switch (err) {
    case 'SendGridError':
      err.message = 'While extracting template from SendGrid: ' + err.message;
      res.serverError(err);
      return true;
    case 'SparkPostError':
      var sperr = {
        name: 'SparkPostError',
        message: 'Error while sending template to SparkPost: ' +
        err.response.errors.map(function (e) {
          var desc = e.description ? ': ' + e.description : '';
          return e.message + desc;
        })
      };
      res.serverError(sperr);
      return true;
    default:
      return false;
  }
}

module.exports = {
  translateTemplate: translateTemplate,
  errorResponse: errorResponse
};
