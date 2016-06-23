"use strict";

var LedgerEntries     = require("../../models/LedgerEntries");
var Log               = require("node-android-logging");

module.exports = {
  getLedgerEntries: getLedgerEntries
};

/**
 * getLedgerEntries retrieves the Ledger Entries from the database and returns them via the response.
 */
function getLedgerEntries(request, response) {
  LedgerEntries.selLedgerEntries().then(function(ledgerEntries) {
    response.json(ledgerEntries);
  }).catch(function(rejection) {
    Log.E(rejection);

    response.status(500).json({
      "result": "ERROR",
      "message": "Unable to retrieve ledger entries"
    });
  });
}

