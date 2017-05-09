'use strict';

let _ = require('lodash')
  , transactional = require('../lib/transactional')
  , campaign = require('../lib/campaign')
  , errors = require('../lib/errors')
  , router = require('express').Router();

router.post('/', function (req, res) {
  let isSendgridCampaign = !!_.get(req, 'body.options.isCampaign')
    , options = req.body.options
    , translatedTemplate;

  if (!req.body.hasOwnProperty('sendgridTemplate')) {
    res.clientError('Request must include a "sendgridTemplate" field containing template');
    return;
  }


  try {
    if (isSendgridCampaign) {
      translatedTemplate = campaign.translateText(req.body.sendgridTemplate);
    } else {
      translatedTemplate = transactional.translateText(req.body.sendgridTemplate, _.pick(options, ['startingDelimiter', 'endingDelimiter']));
    }

    res.json({sparkPostTemplate: translatedTemplate.text, warnings: translatedTemplate.warnings});

  } catch (err) {
    if (!errors.errorResponse(err, res)) {
      err.message = 'Unexpected error: ' + err;
      res.serverError(err);
      throw err;
    }
  }
});

module.exports = router;
