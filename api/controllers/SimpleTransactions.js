/**
 * @module SimpleTransactionsController
 */

"use strict";

var Log               = require("node-android-logging");
var Q                 = require("q");
var SimpleTransactions = require("../../models/SimpleTransactions");

module.exports = {
  get: get
};

function get(request, response) {
  SimpleTransactions.select(request.query.offset, request.query.limit).then(function(simpleTransactions) {
    return SimpleTransactions.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": simpleTransactions.length,
          "results": simpleTransactions,
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

