var siteAnalysisUrl = 'https://api.dev.ssllabs.com/api/v2/analyze?host=';
var moment = require('moment');

module.exports = {
  sslcheck: function sslcheck(report) {
    var validCheck = true;
    // Report is completed.
    var attachment = {
      'fallback': 'SSL Labs Analysis for ' + report.host,
      'title': 'SSL Labs Analysis for ' + report.host,
      'title_link': siteAnalysisUrl + report.host,
      'fields': []
    };

    report.endpointReports.forEach(function endpointReportFormat(endpoint) {
      if (endpoint.grade && !endpoint.grade.startsWith('A') ) {
        validCheck = false;
      }

      var expires = '';
      console.log('Details', endpoint.details);
      if (endpoint.details && endpoint.details.cert) {
        var expirationDate = moment(endpoint.details.cert.notAfter);
        // Check expiration date against NOW + 1 Month in order to give at least one month in advance for warnings
        validCheck = expirationDate - moment().add(1, 'M').utc() > 0;
        expires = ` - expires ${expirationDate.fromNow()} (${expirationDate.format('YYYY-MM-DD')})`;
      }

      attachment.fields.push({
        title: endpoint.serverName,
        value: (endpoint.grade || endpoint.statusMessage) + expires,
        short: false
      });
    });

    attachment.color = validCheck ? 'good' : 'danger';
    return attachment;
  }
};