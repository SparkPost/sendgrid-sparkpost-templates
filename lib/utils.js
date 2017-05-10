'use strict';

function generateWarnings(content, warningTests) {
  let foundInContent = warningTests.filter(syntax => syntax[0].test(content));
  let warnings = foundInContent.map(result => result[1]);
  return warnings;
}

module.exports = {
  generateWarnings: generateWarnings
};
