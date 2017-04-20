'use strict';

var ctrl = require('../lib/translate')
, router = require('express').Router();

router.post('/', function(req, res) {
  var tpl;

  // request: sendgridTemplate: string
  if (!req.body.hasOwnProperty('sendgridTemplate')) {
    res.clientError('Request must include a "sendgridTemplate" field containing template');
    return;
  }

  try {
   tpl = ctrl.translateTemplate({
     html: req.body.sendgridTemplate,
     subject: '<%subject%>'
   }, {
     beginDelimiter: req.body.beginDelimiter,
     endingDelimiter: req.body.endingDelimiter
   });

    console.log(tpl);
    // Response
    res.json({sparkPostTemplate: tpl.html});

  } catch (err) {
    if (!ctrl.errorResponse(err, res)) {
      err.message = 'Unexpected error: ' + err;
      res.serverError(err);
      throw err;
    }
  }
});

module.exports = router;
