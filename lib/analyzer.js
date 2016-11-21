var Promise = require('bluebird');
var siteAnalysisUrl = 'https://api.dev.ssllabs.com/api/v2/analyze';
var endpointDataUrl = 'https://api.dev.ssllabs.com/api/v2/getEndpointData';

var Analyzer = function Analyzer(request) {
  request = request || require('request');
  this.request = request;
};

Analyzer.prototype.checkSite = function checkSite(url, startNew) {
  var analyzer = this;
  return new Promise(function checkSitePromise(resolve, reject) {
    var options = {
      url: siteAnalysisUrl,
      qs: { host: url }
    };

    if (startNew) {
      options.qs.startNew = 'on';
    }

    analyzer.request(options, function requestCheck(err, response, body) {
      if (err || response && response.statusCode !== 200) {
        return reject('Unable to request check from SSL Labs');
      }

      body = JSON.parse(body);
      if (body.status === 'ERROR') {
        return reject(body.statusMessage);
      }

      return resolve(body);
    });
  });
};

Analyzer.prototype.getEndpointData = function getEndpointData(url, endpoint) {
  var analyzer = this;
  return new Promise(function endpointPromise(resolve, reject) {
    var options = {
      url: endpointDataUrl,
      qs: { host: url, s: endpoint }
    };

    analyzer.request(options, function endpointRequest(err, response, body) {
      if (err || response && response.statusCode !== 200) {
        return reject('Unable to request endpoint data from SSL Labs');
      }

      body = JSON.parse(body);
      return resolve(body);
    });
  });
};

Analyzer.prototype.getDetailedReport = function getDetailedReport(url, data) {
  var analyzer = this;
  return new Promise(function reportPromise(resolve) {
    if (!data.endpoints || data.endpoints.length === 0) {
      return resolve(data);
    }

    var promises = data.endpoints.map(function endpointsMap(endpoint) {
      return analyzer.getEndpointData(url, endpoint.ipAddress);
    });

    return Promise.all(promises)
      .then(function allEndpointsCompleted(endpointReports) {
        data.endpointReports = endpointReports;
        return resolve(data);
    });
  });
};

module.exports = Analyzer;