'use strict';

var mdrlTranslationApp = angular.module('mdrlTranslationApp',
    ['translationControllers', 'ui.bootstrap', 'ui.ace', 'ngSanitize'])
  , translationControllers = angular.module('translationControllers', []);

translationControllers.controller('TranslatorControl', ['$scope', '$http', '$log', '$sce',
  function($scope, $http, $log, $sce) {
    $scope.loading = false;
    $scope.sgEditor = null;
    $scope.spEditor = null;
    $scope.marketingTemplate = false;

    function configureEditor(editor) {
      // Disable Ctrl-L binding - it clashes with a common browser keyboard shortcut
      editor.commands.addCommand({
        name: 'gotoline',
        bindKey: {
          win: 'Ctrl-L',
          mac: 'Command-L'
        },
        exec: function() { return false; },
        readOnly: true
      });

      editor.$blockScrolling = Infinity;
    }

    $scope.spEditorLoaded = function(editor) {
      $scope.spEditor = editor;
      configureEditor(editor);
    };

    $scope.sgEditorLoaded = function(editor) {
      $scope.sgEditor = editor;
      configureEditor(editor);
    };

    $scope.translate = function() {
      if (!$scope.spEditor || !$scope.sgEditor) {
        console.log('Editors not initialised!');
        return;
      }
      var sgTemplate = $scope.sgEditor.getValue();
      if(!sgTemplate) {
        showError('Empty SendGrid Template');
        return;
      }
      console.log($scope.startingDelimiter);
      $scope.spEditor.setValue('');
      $scope.loading = true;
      clearAlerts();
      $http({
        method: 'POST',
        url: '/api/translate',
        data: {
          sendgridTemplate: sgTemplate,
          options: {
            isCampaign: !!$scope.marketingTemplate,
            startingDelimiter: $scope.startingDelimiter,
            endingDelimiter: $scope.endingDelimiter ? $scope.startingDelimiter : undefined
          }
        }
      }).then(function(result) {
        if (result.errors) {
          console.log('Error: ' + JSON.stringify(result.errors, null, '  '));
        } else {
          showInfo('Translation succeeded!');
          $scope.spEditor.setValue(result.data.sparkPostTemplate);
          result.data.warnings.forEach(function(warning) {
            showWarning(warning);
          });
        }
      }).catch(function(err) {
        if (err.data.errors) {
          err.data.errors.forEach(function(error) {
            showSyntaxError(error.message);
          });
        } else {
          console.error(err);
          showError('Internal error HTTP=' + err.statusText +
            '.  Check your console for detail and please ping us on <a href="http://slack.sparkpost.com/">Slack</a> or help.'
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

    function showSyntaxError(msg) {
      $scope.alerts.unshift({type: 'danger', msg: msg, pre: true});
    }

    function markupMsg(msg) {
      return $sce.trustAsHtml(msg.replace(/\n/g, '<br>'));
    }
  }]);

