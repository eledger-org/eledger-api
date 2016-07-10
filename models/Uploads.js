/**
 * @module  Uploads
 * @extends DefaultModelActions
 */

"use strict";

var defaultModel      = require("./DefaultModelActions");
var Mysqlc            = require("../Mysqlc");
var squel             = require("squel");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.getMultiUploadData = function(args) {
  let ctg_le_stats = squel.select()
    .field("SUM(credit) / 100000", "sumCredit")
    .field("MAX(credit) / 100000", "maxCredit")
    .field("SUM(debit) / 100000", "sumDebit")
    .field("MAX(debit) / 100000", "maxDebit")
    .field("MAX(generalLedgerDate)", "generalLedgerDate")
    .field("MAX(uploadId)", "uploadId")
    .field("transactionId")
    .from("ComplexTransactionsGlue")
    .left_join("LedgerEntries ON ledgerEntryId = LedgerEntries.id")
    .group("transactionId");

  let ctg_le_view = squel.select()
    .field("description")
    .field("account")
    .field("credit / 100000", "credit")
    .field("debit / 100000", "debit")
    .field("transactionId")
    .from("ComplexTransactionsGlue")
    .left_join("LedgerEntries ON ledgerEntryId = LedgerEntries.id");

  let stats = squel.select()
    .field("ctg.transactionId", "transactionId")
    .field("ctg.id", "complexTransactionId")
    .field("ctg.uploadId", "uploadId")
    .field("max_credit_view.description", "description")
    .field("cAccount.accountName", "creditAcctName")
    .field("cAccount.accountShortName", "creditAcctShortName")
    .field("cAccount.id", "creditAccountId")
    .field("getLongAccountString(cAccount.id)", "creditAcctString")
    .field("getAccountString(cAccount.id)", "creditAcctShortString")
    .field("dAccount.accountName", "debitAcctName")
    .field("dAccount.accountShorTName", "debitAcctShortName")
    .field("dAccount.id", "debitAccountId")
    .field("getLongAccountString(dAccount.id)", "debitAcctString")
    .field("getAccountString(dAccount.id)", "debitAcctShortString")
    .field("ctg_le_stats.sumCredit", "sumCredit")
    .field("ctg_le_stats.sumDebit", "sumDebit")
    .field("ctg_le_stats.generalLedgerDate", "generalLedgerDate")
    .from("ComplexTransactionsGlue", "ctg")
    .left_join(ctg_le_stats, "ctg_le_stats", "ctg_le_stats.transactionId = ctg.transactionId")
    .left_join(ctg_le_view, "max_credit_view", "ctg_le_stats.transactionId = max_credit_view.transactionId AND ctg_le_stats.maxCredit = max_credit_view.credit")
    .left_join("Accounts cAccount ON cAccount.id = max_credit_view.account")
    .left_join(ctg_le_view, "max_debit_view", "ctg_le_stats.transactionId = max_debit_view.transactionId AND ctg_le_stats.maxDebit = max_debit_view.debit")
    .left_join("Accounts dAccount ON dAccount.id = max_debit_view.account");

  let query = squel.select()
    .field("Uploads.id", "id")
    .field("Uploads.filename", "filename")
    .field("stats.*")
    .field("IFNULL(stats.generalLedgerDate, Uploads.createdDate)", "generalLedgerDate")
    .from("Uploads")
    .left_join(stats, "stats", "stats.uploadId = Uploads.id");

  if (args.id) {
    query = query.where("Uploads.id = ?", args.id);
  }

  if (args.orderBy && args.orderDir) {
    query = query.order(args.orderBy, args.orderDir);
  } else {
    query = query.order("generalLedgerDate", false);
  }

  if (args.limit) {
    query = query.limit(args.limit);
  }

  if (args.offset) {
    query = query.offset(args.offset);
  }

  return Mysqlc.rawQueryPromise(query.toParam());
};


module.exports.tName = "Uploads";

module.exports.getUnmapped = function() {
  let CTG = require("./ComplexTransactionsGlue");
  let STG = require("./SimpleTransactionsGlue");

  let query = squel.select()
    .from(this.tName)
    .where("id NOT IN ?", squel.select().field("uploadId").from(STG.tName).where("uploadId IS NOT NULL"))
    .where("id NOT IN ?", squel.select().field("uploadId").from(CTG.tName).where("uploadId IS NOT NULL"))
    .limit(1)
    .toParam();

  return Mysqlc.rawQueryPromise(query);
};

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE uploads (
  id                    BIGINT        NOT NULL AUTO_INCREMENT,
  filename              VARCHAR(255)  NOT NULL,
  uniqid                VARCHAR(255)  NOT NULL,
  dt                    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
  );
` ];

/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 1,
    query: module.exports.initialCreates[0]
  },
  {
    sortFloatIndex: 2,
    query: `
ALTER   TABLE   uploads
CHANGE  COLUMN  id
  id                    BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT;
  `
  },
  {
    sortFloatIndex: 6,
    query: `
RENAME  TABLE   uploads
TO              Uploads
    `
  },
  {
    sortFloatIndex: 7,
    query: `
ALTER   TABLE   Uploads
ADD COLUMN
  serviceName           VARCHAR(255)      NOT NULL    AFTER id,
ADD COLUMN
  createdDate           BIGINT UNSIGNED   NOT NULL,
ADD COLUMN
  createdBy             BIGINT UNSIGNED   NOT NULL,
ADD COLUMN
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
ADD COLUMN
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
ADD COLUMN
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
ADD COLUMN
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL
    `
  },
  {
    sortFloatIndex: 8,
    query: `
UPDATE Uploads
SET Uploads.createdDate = UNIX_TIMESTAMP(dt)
    `
  },
  {
    sortFloatIndex: 9,
    query: `
ALTER   TABLE   Uploads
DROP    COLUMN  dt
    `
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = [ `
CREATE TABLE Uploads (
  id                    BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  serviceName           VARCHAR(255)      NOT NULL,
  filename              VARCHAR(255)      NOT NULL,
  uniqid                VARCHAR(255)      NOT NULL,
  createdDate           BIGINT UNSIGNED   NOT NULL,
  createdBy             BIGINT UNSIGNED   NOT NULL,
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL,
  PRIMARY KEY (id)
  );
` ];

