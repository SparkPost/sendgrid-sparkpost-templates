'use strict';

const SparkPost = require('sparkpost');
const _ = require('lodash');

function storeSparkPostTemplate(apiKey, translatedTemplate) {

  let spClient = new SparkPost(apiKey),
    spTemplateObj = {
      id: translatedTemplate.id,
      name: translatedTemplate.name,
      content: {
        from: translatedTemplate.from,
        subject: translatedTemplate.subject,
        html: translatedTemplate.html,
        text: translatedTemplate.text
      }
    };

  if(translatedTemplate.replyTo) {
    spTemplateObj.content.reply_to = translatedTemplate.replyTo;
  }

  return spClient.templates.create(spTemplateObj)
    .then(result => {
      console.log('here');
      console.log(result);
      return result;
    })
    .catch(err => {
      console.log('here 2');
      console.log(err);
      throw {
        name: 'SparkPostError',
        message: err.message,
        error: err
      };
    });
}


module.exports = storeSparkPostTemplate;

