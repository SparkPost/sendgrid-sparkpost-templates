'use strict';

let _ = require('lodash')
  , transactional = require('../lib/transactional')
  , campaign = require('../lib/campaign')
  , sendgrid = require('../lib/sendgrid')
  , sparkpost = require('../lib/sparkpost')
  , router = require('express').Router();


function validate(req) {
  return new Promise((resolve, reject) => {
    if (!req.body.hasOwnProperty('sendgridTemplateId')) {
      reject(new Error('Expected sendgridTemplateId field'));
    }

    if (!req.body.hasOwnProperty('sendgridAPIKey')) {
      reject(new Error('Expected sendgridAPIKey field'));
    }

    if (req.body.hasOwnProperty('useHerokuSPAPIKey') && req.body.useHerokuSPAPIKey) {
      if (!process.env.SPARKPOST_API_KEY) {
        reject(new Error('Heroku SparkPost API key not found. Are we running under Heroku with the SparkPost addon?'));
      }
    } else if (!req.body.hasOwnProperty('sparkPostAPIKey')) {
      reject(new Error('Expected sparkPostAPIKey field'));
    }

    resolve();
  });
}

function getApiKey(req) {

  if (process.env.SPARKPOST_API_KEY) {
    return resolve(process.env.SPARKPOST_API_KEY);
  }
  return req.body.sparkPostAPIKey;

}

function getSandboxDomain() {
  return process.env.SPARKPOST_SANDBOX_DOMAIN || 'sparkpostbox.com';
}

function extractTemplate(req) {
  let isSgCampaign = _.get(req, 'body.options.isSendgridCampaign');

  return sendgrid.extractTemplate(req.body.sendgridAPIKey, req.body.sendgridTemplateId, isSgCampaign)
  .catch(err => Promise.reject({
    name: err.name,
    message: `Error encountered while extracting template ${req.body.sendgridTemplateId} from SendGrid: ${err.error.response.body.errors.map(e => e.message).join('\n')}`
  }));
}

function translate(req, templateData) {
  let isCampaign = _.get(req, 'body.options.isSendgridCampaign', false)
    , useSandboxDomain = _.get(req, 'body.options.useSandboxDomain', false)
    , options = {
    sandboxDomain: getSandboxDomain(req),
    useSandboxDomain: useSandboxDomain
  };

  return new Promise((resolve) => {
    if (isCampaign) {
      resolve(campaign.translate(templateData, options));
    } else {
      _.extend(options, _.pick(req.body.options, ['startingDelimiter', 'endingDelimiter']));
      resolve(transactional.translate(templateData, options));
    }
  });
}

function save(template, apiKey) {
  return sparkpost.save(template, apiKey)
  .catch(err => Promise.reject({
    name: err.name,
    message: `Error encountered while saving template ${template.name} to SparkPost: ${err.message}`
  }));
}

router.post('/', function (req, res) {
  let spAPIKey = getApiKey(req)
    , warnings;

  return validate(req)
    .then(() => {
      return extractTemplate(req)
    })
    .then((templateData)=> {
      return translate(req, templateData);
    })
    .then((translatedTemplate) => {
      warnings = translatedTemplate.warnings;
      return save(translatedTemplate.template, spAPIKey);
    })
    .then((result) => {
      return res.json({result: true, response: result, warnings: warnings});
    })
    .catch(err => {
      console.dir(err);
      res.clientError(err.message);
    });

});

module.exports = router;

