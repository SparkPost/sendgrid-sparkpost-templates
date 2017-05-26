'use strict';

const SparkPost = require('sparkpost');
const _ = require('lodash');
const version = require('../package.json').version;

function storeSparkPostTemplate(translatedTemplate, apiKey) {

  let spClient = new SparkPost(apiKey),
    spTemplateObj = {
      id: translatedTemplate.id,
      name: translatedTemplate.name,
      content: {
        from: translatedTemplate.from,
        subject: translatedTemplate.subject,
        html: translatedTemplate.html,
        text: translatedTemplate.text
      },
      description: 'Translated by sendgrid2sparkpost ' + version
    };

  if(translatedTemplate.replyTo) {
    spTemplateObj.content.reply_to = translatedTemplate.replyTo;
  }

  return spClient.templates.create(spTemplateObj)
    .then(result => {
      return result;
    })
    .catch(err => {
      throw {
        name: 'SparkPostError',
        message:  _.get(err, 'errors[0].description', err.message),
        error: err
      };
    });
}


module.exports = {
  save: storeSparkPostTemplate
};

