'use strict';

function errorResponse(err, res) {
  switch (err) {
    case 'SendGridError':
      err.message = 'While extracting template from SendGrid: ' + err.message;
      res.serverError(err);
      return true;
    case 'SparkPostError':
      let sperr = {
        name: 'SparkPostError',
        message: 'Error while sending template to SparkPost: ' +
        err.response.errors.map(function (e) {
          let desc = e.description ? ': ' + e.description : '';
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
  errorResponse: errorResponse
};
