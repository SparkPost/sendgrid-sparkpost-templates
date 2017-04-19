'use strict';

var ctrl = require('../lib')

  , extractSendgridTemplate = require('../lib/sendgrid')
  , storeSparkPostTemplate = require('../lib/sparkpost')
  , router = require('express').Router();

// Request: {sendgridTemplateName: '...', sendgridAPIKey: '...'}
// Error: {errors: ['...', ...]
// Response: {result: true}
router.post('/', function (req, res) {
  var spAPIKey
    , useSandboxDomain = false;

  // Validation
  if (!req.body.hasOwnProperty('sendgridTemplateId')) {
    return res.clientError('Expected sendgridTemplateId field');
  }

  if (!req.body.hasOwnProperty('sendgridAPIKey')) {
    return res.clientError('Expected sendgridAPIKey field');
  }

  if (req.body.hasOwnProperty('useHerokuSPAPIKey') && req.body.useHerokuSPAPIKey) {
    if (process.env.SPARKPOST_API_KEY) {
      spAPIKey = process.env.SPARKPOST_API_KEY;
    } else {
      return res.clientError('Heroku SparkPost API key not found. Are we running under Heroku with the SparkPost addon?');
    }
  } else if (!req.body.hasOwnProperty('sparkPostAPIKey')) {
    return res.clientError('Expected sparkPostAPIKey field');
  } else {
    spAPIKey = req.body.sparkPostAPIKey;
  }

  if (req.body.hasOwnProperty('useSandboxDomain')) {
    useSandboxDomain = req.body.useSandboxDomain;
  }

  extractSendgridTemplate(req.body.sendgridAPIKey, req.body.sendgridTemplateId, req.body.sengridIsCampaign)
    .then(function (sendgridTpl) {

      var sparkPostTpl = ctrl.translateTemplate(sendgridTpl, {
        useSandboxDomain: useSandboxDomain
      });

      //console.log(sparkPostTpl);
      //console.log('here');
      return storeSparkPostTemplate(spAPIKey, sparkPostTpl);
    })
    .then(function (storeResult) {
      console.log(storeResult);
      return res.json({result: true, response: storeResult});
    })
    .catch(function (err) {
      if (!ctrl.errorResponse(err, res)) {
        err.message = 'Unexpected error: ' + err.message;
        res.serverError(err);
        throw err;
      }
    });
});

module.exports = router;

