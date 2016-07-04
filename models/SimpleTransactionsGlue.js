/**
 * @module  Uploads
 * @extends DefaultModelActions
 */

"use strict";

var _                 = require("underscore");
var defaultModel      = require("./DefaultModelActions");
var Mysqlc            = require("../Mysqlc");
var Q                 = require("q");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "SimpleTransactionsGlue";

module.exports.finalizeModel = function() {
  var SimpleTransactionsGlue = require("./SimpleTransactionsGlue");

  return Q.all(_.map(views, function(view) {
    return Mysqlc.rawQueryPromise(view);
  }));
};

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE SimpleTransactionsGlue (
  id                    BIGINT UNSIGNED   AUTO_INCREMENT,
  uploadId              BIGINT UNSIGNED   DEFAULT 0,
  originEntry           BIGINT UNSIGNED   NOT NULL,
  destinationEntry      BIGINT UNSIGNED   NOT NULL,
  transactionDate       BIGINT UNSIGNED   NOT NULL,
  transactionNumber     BIGINT UNSIGNED   DEFAULT NULL,
  reconciled            VARCHAR(255)      DEFAULT "NO",
  exchange              BIGINT            DEFAULT 0,
  createdDate           BIGINT UNSIGNED   NOT NULL,
  createdBy             BIGINT UNSIGNED   NOT NULL,
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL,
  PRIMARY KEY (id)
);
` ];

var views = [ `
CREATE OR REPLACE VIEW SimpleTransactions AS
SELECT
  SimpleTransactionsGlue.id                 AS id,
  SimpleTransactionsGlue.uploadId           AS uploadId,
  SimpleTransactionsGlue.transactionDate    AS date,
  SimpleTransactionsGlue.transactionNumber  AS number,
  SimpleTransactionsGlue.reconciled         AS reconciled,
  SimpleTransactionsGlue.exchange           AS exchange,
  origin.id                                 AS OriginId,
  originAcct.accountShortName               AS originShort,
  originAcct.accountName                    AS originLong,
  destin.id                                 AS DestinId,
  destinAcct.accountShortName               AS destinShort,
  destinAcct.accountName                    AS destinLong,
FROM
  SimpleTransactionsGlue
LEFT JOIN
  LedgerEntries AS origin ON origin.id = originEntry
LEFT JOIN
  LedgerEntries AS destin ON destin.id = destinEntry
LEFT JOIN
  Accounts AS originAcct ON originAcct.id = origin.account
LEFT JOIN
  Accounts AS destinAcct ON destinAcct.id = destin.account
;
` ];

/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 15,
    query: module.exports.initialCreates[0]
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = module.exports.initialCreates.slice();

