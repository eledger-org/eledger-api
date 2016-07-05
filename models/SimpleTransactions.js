/**
 * @module SimpleTransactions
 *
 * @description
 * This helper module serves to aggregate data from LedgerEntries and Uploads models and provide a
 * single interface for getting their joined data and joining it into a combined SimpleTransaction object.
 *
 * Conceptually, the SimpleTransaction object is something like this:
 *  {
 *    ledgerEntries: [],
 *    uploads:       []
 *  }
 */

"use strict";

var _                 = require("underscore");
var Accounts          = require("./Accounts");
var LedgerEntries     = require("./LedgerEntries");
var Log               = require("node-android-logging");
var Mysqlc            = require("../Mysqlc");
var Q                 = require("q");
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
    .field("origin.description", "description")
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

module.exports.post = function(request) {
  return require("./SimpleTransactions").postBody(request.body);
};

module.exports.postBody = function(body) {
  return Q.all(body.results.map(function(result) {
    if (typeof result.exchange !== "number") {
      throw new Error("exchange must be numeric");
    }

    result.originQuery = squel.insert().into(LedgerEntries.tName)
      .setFields({
        generalLedgerDate: result.transactionDate,
        description: result.description,
        account: result.originEntry,
        credit: (result.exchange > 0 ? result.exchange : 0),
        debit: (result.exchange < 0 ? 0 - result.exchange : 0),
        createdBy: 0,
        createdDate: (new Date()).getTime() / 1000
      }).toParam();

    result.destinQuery = squel.insert().into(LedgerEntries.tName)
      .setFields({
        generalLedgerDate: result.transactionDate,
        description: result.description,
        account: result.destinEntry,
        credit: (result.exchange < 0 ? 0 - result.exchange : 0),
        debit: (result.exchange > 0 ? result.exchange : 0),
        createdBy: 0,
        createdDate: (new Date()).getTime() / 1000
      }).toParam();

    result.simpleQuery = squel.insert().into(SimpleTransactionsGlue.tName)
      .setFields({
        uploadId: result.uploadId,
        transactionDate: result.transactionDate,
        exchange: result.exchange,
        createdBy: 0,
        createdDate: (new Date()).getTime() / 1000
      });

    return Mysqlc.rawQueryPromise(result.originQuery).then(function(originQueryResult) {
      result.originId = originQueryResult.insertId;

      return Mysqlc.rawQueryPromise(result.destinQuery);
    }).then(function(destinQueryResult) {
      result.destinId = destinQueryResult.insertId;
      result.simpleQuery = result.simpleQuery
        .set("originEntry", result.originId)
        .set("destinationEntry", result.destinId)
        .toParam();

      return Mysqlc.rawQueryPromise(result.simpleQuery);
    });
  }));
};

