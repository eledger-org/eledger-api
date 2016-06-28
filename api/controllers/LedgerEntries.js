/**
 * @module LedgerEntriesController
 */

"use strict";

var LedgerEntries     = require("../../models/LedgerEntries");
var Log               = require("node-android-logging");
var Q                 = require("q");

module.exports = {
  get: get
};

/**
 * Retrieves the Ledger Entries from the database and returns them via the response.
 */
function get(request, response) {
  LedgerEntries.select(request.query.offset, request.query.limit).then(function(ledgerEntries) {
    return LedgerEntries.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": ledgerEntries.length,
          "results": ledgerEntries,
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

