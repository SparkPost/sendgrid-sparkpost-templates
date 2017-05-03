'use strict';

let _ = require('lodash');

/**
 * Find custom delimited substitution tags. They can be like :tag:, %tag%, #tag# or :tag. It can't contain spaces
 * We'll respect one type at a time.
 * In case :tag, we'll find until word boundary.
 * Valid chars: alphanum, _ (underscore), - (dash)
 * @param content
 * @param substitutions
 * @returns {*}
 */
function translateCustomDelimited(content, startingDelimiter, endingDelimiter) {

  let delimiterRegex;
  //Todo: Fix replacing ::tag (with :{{ tag }}) or ::tag:: (with :{{ tag }}: )
  if (endingDelimiter) {
    delimiterRegex = new RegExp(`(\\${startingDelimiter}{1}(\\w+)\\${endingDelimiter}{1})`, 'gi');
  } else {
    delimiterRegex = new RegExp(`(\\${startingDelimiter}{1}(\\w+))`, 'gi');
  }


  content = content.replace(delimiterRegex, (match, nameWithDelimiter, nameWithoutDelimeter) => {
    return `{{ ${nameWithoutDelimeter} }}`;
  });

  return content;
}

function translateByRules(rules, content) {
  _.each(rules, function (rule) {
    content = content.replace(rule[0], rule[1]);
  });

  return content;
}

module.exports = {
  translate: translateByRules,
  translateCustomDelimited: translateCustomDelimited
};