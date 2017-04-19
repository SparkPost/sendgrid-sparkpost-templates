'use strict';

var sgMigrationApp = angular.module('sgMigrationApp', ['migrationControllers', 'ui.bootstrap', 'ngSanitize'])
  , migrationControllers = angular.module('migrationControllers', []);

migrationControllers.controller('MigrateControl', ['$scope', '$http', '$log',
  function($scope, $http, $log) {
    $scope.loading = false;
    $scope.sgAPIKey = '';
    $scope.sgTpl = '';
    $scope.marketingTemplate = false;
    $scope.spAPIKey = '';
    $scope.useHerokuSPAPIKey = false;
    $scope.useSandboxDomain = true;
    $scope.sandboxDomain = '';

    $http.get('/api/sandboxDomain').then(function(result) {
      $scope.sandboxDomain = result.data.sandboxDomain;
    }).catch(function(err) {
      $scope.sandboxDomain = 'sparkpostbox.com';
      console.log('While GETting from /api/sandboxDomain: ');
      console.error(err);
    });

    $scope.migrate = function(formIsValid) {
      if (!formIsValid) {
        return;
      }
      $scope.loading = true;
      $http({
        method: 'POST',
        url: '/api/migrate',
        data: {
          sendgridAPIKey: $scope.sgAPIKey,
          sendgridTemplateId: $scope.sgTpl,
          sengridIsCampaign: $scope.marketingTemplate,
          useHerokuSPAPIKey: $scope.useHerokuSPAPIKey,
          sparkPostAPIKey: $scope.spAPIKey,
          useSandboxDomain: $scope.useSandboxDomain
        }
      }).then(function(result) {
        if (result.errors) {
          console.log('Error: ' + JSON.stringify(result.errors, null, '  '));
        } else {
          showInfo('Migration of ' + $scope.sgTpl + ' succeeded!');
        }
      }).catch(function(err) {
        if (err.data.errors) {
          err.data.errors.forEach(function(error) {
            showError(error.message);
          });
        } else {
          console.error(err);
          showError(`Internal error HTTP=${err.statusText}. \
            Check your console for detail and please ping us on <a href="http://slack.sparkpost.com/">Slack</a> or help.`
          );
        }
      }).finally(function() {
        $scope.loading = false;
      });
    };

    $scope.alerts = [];
    $scope.closeAlert = function(idx) {
      $scope.alerts.splice(idx, 1);
    };

    function showInfo(msg) {
      $scope.alerts.unshift({type: 'success', msg: markupMsg(msg)});
    }

    function showWarning(msg) {
      $scope.alerts.unshift({type: 'warning', msg: markupMsg(msg)});
    }

    function showError(msg) {
      $scope.alerts.unshift({type: 'danger', msg: markupMsg(msg)});
    }
    function markupMsg(msg) {
      return msg.replace(/\n/g, '<br>');
    }
  }]);

