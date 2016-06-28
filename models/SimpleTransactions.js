/**
 * @module SimpleLedgers
 *
 * @description
 * This helper module serves to aggregate data from LedgerEntries and Uploads models and provide a
 * single interface for getting their joined data and joining it into a combined SimpleLedger object.
 *
 * Conceptually, the SimpleLedger object is something like this:
 *  {
 *    ledgerEntries: [],
 *    uploads:       []
 *  }
 */

"use strict";

var _                 = require("underscore");
var Accounts          = require("./Accounts");
var LedgerEntries     = require("./LedgerEntries");
var Mysqlc            = require("../Mysqlc");
var SimpleTransactionsGlue = require("./SimpleTransactionsGlue");
var squel             = require("squel");

var DefaultModelActions = require("./DefaultModelActions");

module.exports.select = function(offset, limit) {
  let query = squel.select()
    .field("SimpleTransactionsGlue.id", "id")
    .field("SimpleTransactionsGlue.uploadId", "uploadId")
    .field("SimpleTransactionsGlue.transactionDate", "date")
    .field("SimpleTransactionsGlue.transactionNumber", "number")
    .field("SimpleTransactionsGlue.reconciled", "reconciled")
    .field("SimpleTransactionsGlue.exchange", "exchange")
    .field("origin.id", "OriginId")
    .field("getAccountString(originAcct.id)", "originShort")
    .field("getLongAccountString(originAcct.id)", "originLong")
    .field("destin.id", "DestinId")
    .field("getAccountString(destinAcct.id)", "destinShort")
    .field("getLongAccountString(destinAcct.id)", "destinLong")
    .from(SimpleTransactionsGlue.tName)
    .left_join(LedgerEntries.tName, "origin", "origin.id = originEntry")
    .left_join(LedgerEntries.tName, "destin", "destin.id = destinationEntry")
    .left_join(Accounts.tName, "originAcct", "originAcct.id = origin.account")
    .left_join(Accounts.tName, "destinAcct", "destinAcct.id = destin.account")
    .offset(_().coalesce(offset, DefaultModelActions.DEFAULT_OFFSET))
    .limit(_().coalesce(limit, DefaultModelActions.DEFAULT_LIMIT))
    .toParam();

  return Mysqlc.rawQueryPromise(query);
};

module.exports.count = function() {
  return SimpleTransactionsGlue.count();
};

