'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const morgan = require('morgan');
const translateRouter = require('./routes/translate');
const migrateRouter = require('./routes/migrate');

function startServer(next) {
  // ----------------------------------------------------------------------------
  let app = express()
    , srv = http.Server(app);

  app.use(express.static(__dirname + '/static'));
  app.use('/vendor', express.static(__dirname + '/vendor/client'));

  // ----------------------------------------------------------------------------

  app.use(bodyParser.json({
    limit: '2mb'
  }));

  app.use(morgan('combined'));

  app.use(function(req, res, next) {
    function conditionError(err) {
      let keylist = ['name', 'message', 'description', 'code', 'row', 'col']
        , ret = {};
      Object.keys(err).forEach(function(k) {
        if (keylist.indexOf(k) >= 0) {
          ret[k] = err[k];
        }
      });
      return ret;
    }

    function errorResponse(code, errlist) {
      res.status(code).send({
        errors: errlist.map(conditionError)
      });
    }

    res.clientError = function(err) { errorResponse(400, [{message: err}]); };
    res.serverError = function(err) { errorResponse(500, [err]); };
    res.clientErrorList = function(errList) { errorResponse(400, errList); };
    res.serverErrorList = function(errList) { errorResponse(500, errList); };

    next();
  });

  app.use('/api/translate', translateRouter);
  app.use('/api/migrate', migrateRouter);

  srv.listen(process.env.PORT || 3000, function() {
    next(srv, app);
  });
}

exports.startServer = startServer;

