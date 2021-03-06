'use strict';

var sgMigrationApp = angular.module('sgMigrationApp', ['migrationControllers', 'ui.bootstrap', 'ngSanitize'])
  , migrationControllers = angular.module('migrationControllers', []);

migrationControllers.controller('MigrateControl', ['$scope', '$http', '$log',
  function ($scope, $http, $log) {
    $scope.loading = false;
    $scope.sgAPIKey = '';
    $scope.sgTpl = '';
    $scope.marketingTemplate = false;
    $scope.spAPIKey = '';
    $scope.useHerokuSPAPIKey = false;
    $scope.useSandboxDomain = true;
    $scope.sandboxDomain = 'sparkpostbox.com'; //TODO make it configurable?

    $scope.startingDelimiter = '%';
    $scope.endingDelimiter = true;

    $scope.$watch('marketingTemplate', function (newValue) {
      if (!newValue) {
        $scope.useSandboxDomain = true;
      }
    });

    $scope.migrate = function (formIsValid) {
      if (!formIsValid) {
        return;
      }
      $scope.loading = true;
      var options = {
        useHerokuSPAPIKey: !!$scope.useHerokuSPAPIKey,
        isSendgridCampaign: !!$scope.marketingTemplate,
        useSandboxDomain: !!$scope.useSandboxDomain,
        startingDelimiter: $scope.marketingTemplate ? undefined : $scope.startingDelimiter,
        endingDelimiter: !$scope.marketingTemplate && $scope.endingDelimiter ? $scope.startingDelimiter : undefined
      };

      clearAlerts();
      $http({
        method: 'POST',
        url: '/api/migrate',
        data: {
          sendgridAPIKey: $scope.sgAPIKey,
          sendgridTemplateId: $scope.sgTpl,
          sparkPostAPIKey: $scope.spAPIKey,
          options: options
        }
      }).then(function (result) {
        if (result.errors) {
          console.log('Error: ' + JSON.stringify(result.errors, null, '  '));
        } else {
          var link = '';
          try {
            link = ' <a target="_blank" href="https://app.sparkpost.com/templates/edit/' + result.data.response.results.id + '">View Template</a>';
          } catch (e) {
            console.error(e);
            link = '';
          }

          result.data.warnings.forEach(function(warning) {
            showWarning(warning);
          });

          showInfo('Migration of ' + $scope.sgTpl + ' succeeded! ' + link);
        }
      }).catch(function (err) {
        if (err.data.errors) {
          err.data.errors.forEach(function (error) {
            showError(error.message);
          });
        } else {
          console.error(err);
          showError(`Internal error HTTP=${err.statusText}. \
            Check your console for detail and please ping us on <a href="http://slack.sparkpost.com/">Slack</a> or help.`
          );
        }
      }).finally(function () {
        $scope.loading = false;
      });
    };

    $scope.alerts = [];
    $scope.closeAlert = function (idx) {
      $scope.alerts.splice(idx, 1);
    };

    function clearAlerts() {
      $scope.alerts = [];
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

