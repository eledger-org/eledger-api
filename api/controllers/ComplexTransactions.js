/**
 * @module ComplexTransactionsController
 */

"use strict";

var Log               = require("node-android-logging");
var Q                 = require("q");
var ComplexTransactions = require("../../models/ComplexTransactions");

module.exports = {
  get: get,
  post: post
};

function get(request, response) {
  ComplexTransactions.select(request.query.offset, request.query.limit).then(function(complexTransactions) {
    return ComplexTransactions.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": complexTransactions.length,
          "results": complexTransactions,
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve ledger entries"
    });
  });
}

function post(request, response) {
  Log.I(request.body);

  ComplexTransactions.post(request).then(function(result) {
    response.status(200).json({
      "result": "OK",
      "results": result
    });
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to post request"
    });
  });
}

