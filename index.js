var Analyzer = require('./lib/analyzer');

var analyzer = new Analyzer();
var formatter = require('./lib/formatter');

module.exports = function sslCheckDroid() {
  return {
    sslCheck: function sslCheck(req, res) {
      var droid = this;
      analyzer.checkSite(req.params.url, req.params.startNew)
        .then(function checkSiteCompleted(data) {
          if (data.status !== 'READY') {
            // Continue polling status
            delete req.params.startNew;
            return setTimeout(function timeoutCheckSite() {
              res.text('_Continuing SSL analysis for ' + req.params.url + ' - Status:_ `' + data.status + '`').send();
              droid.sslCheck(req, res);
            }, 60000);
          }

          // Analysis complete - Retrieve endpoints information
          return analyzer.getDetailedReport(req.params.url, data)
            .then(function detailedReportCompleted(report) {
              var attachment = formatter.sslcheck(report);
              if (req.params.channel && attachment.color === 'danger') {
                res.attachment(attachment, req.params.channel);
              }

              return res.attachment(attachment).send();
            })
            .catch(function detailedReportError(err) {
              return res.text('An error has occurred while trying to exeucte a SSL check.\n```' + err + '```').send();
            });
        })
        .catch(function checkSiteError(err) {
          return res.text('An error has occurred while trying to exeucte a SSL check.\n```' + err + '```').send();
        });
    },
    newSslCheck: function newSslCheck(req, res) {
      req.params.startNew = true;
      this.sslCheck(req, res);
    },
    sslAlert: function sslAlert(req, res) {
      req.params.startNew = true;
      this.sslCheck(req, res);
    }
  };
};