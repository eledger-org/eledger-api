/**
 * @module ComplexTranslations
 *
 * @description
 * This helper module serves to aggregate data from LedgerEntries and Uploads models and provide a
 * single interface for getting their joined data and joining it into a combined ComplexTransaction object.
 *
 * Conceptually, the ComplexTransaction object is something like this:
 *  {
 *    ledgerEntries: [],
 *    uploads:       []
 *  }
 */

"use strict";

var _                 = require("underscore");
var ComplexTransactionsGlue = require("./ComplexTransactionsGlue");
var date              = require("../util/date");
var LedgerEntries     = require("./LedgerEntries");
var Log               = require("node-android-logging");
var Mysqlc            = require("../Mysqlc");
var Q                 = require("q");
var squel             = require("squel");
var Transactions      = require("./Transactions");

var DefaultModelActions = require("./DefaultModelActions");

module.exports.select = function(offset, limit) {
  let query = squel.select()
    .from(ComplexTransactionsGlue.tName)
    .offset(_().coalesce(offset, DefaultModelActions.DEFAULT_OFFSET))
    .limit(_().coalesce(limit, DefaultModelActions.DEFAULT_LIMIT))
    .toParam();

  return Mysqlc.rawQueryPromise(query);
};

module.exports.post = function(request) {
  return require("./ComplexTransactions").postBody(request.body);
};

module.exports.postBody = function(body) {
  return Q.all(body.results.map(function(complexTransaction) {
    complexTransaction.metadata.createdDate = date.now();
    complexTransaction.metadata.createdBy = 0;

    return Mysqlc.rawQueryPromise(squel.insert()
      .into(Transactions.tName)
      .setFields(complexTransaction.metadata)
      .toParam()).then(function(result) {
        let complexTransactionId = result.insertId;

        let thisList = [];

        complexTransaction.ledgerEntries.forEach(function(ledgerEntry) {
          ledgerEntry.createdDate = date.now();
          ledgerEntry.createdBy   = 0;

          thisList.push({
            transactionId: complexTransactionId,
            ledgerEntry: ledgerEntry
          });
        });

        complexTransaction.uploads.forEach(function(upload) {
          thisList.push({
            createdDate: date.now(),
            createdBy: 0,
            transactionId: complexTransactionId,
            uploadId: upload.id
          });
        });

        return Q.all(thisList.map(function(complexTransactionRow) {
          if (complexTransactionRow.ledgerEntry !== undefined) {
            let query = squel.insert()
              .into(LedgerEntries.tName)
              .setFields(complexTransactionRow.ledgerEntry)
              .toParam();

            return Mysqlc.rawQueryPromise(query).then(function(result) {
              let query = squel.insert()
                .into(ComplexTransactionsGlue.tName)
                .setFields({
                  createdDate: date.now(),
                  createdBy: 0,
                  transactionId: complexTransactionId,
                  ledgerEntryId: result.insertId
                }).toParam();

              return Mysqlc.rawQueryPromise(query);
            });
          } else if (complexTransactionRow.uploadId !== undefined) {
            let query = squel.insert()
              .into(ComplexTransactionsGlue.tName)
              .setFields(complexTransactionRow)
              .toParam();

            return Mysqlc.rawQueryPromise(query);
          } else {
            Log.E(complexTransactionRow);

            throw new Error("Expected an upload or a ledger entry.");
          }
        }));
      });
  }));
};

