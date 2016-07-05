/**
 * @module  ComplexTransactionsGlue
 * @extends DefaultModelActions
 */

"use strict";

var defaultModel      = require("./DefaultModelActions");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "ComplexTransactionsGlue";

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE ComplexTransactionsGlue (
  id                    BIGINT UNSIGNED   AUTO_INCREMENT,
  transactionId         BIGINT UNSIGNED   DEFAULT NULL,
  uploadId              BIGINT UNSIGNED   DEFAULT NULL,
  ledgerEntryId         BIGINT UNSIGNED   DEFAULT NULL,
  createdDate           BIGINT UNSIGNED   DEFAULT NULL,
  createdBy             BIGINT UNSIGNED   DEFAULT NULL,
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL,
  PRIMARY KEY (id)
);
` ];

/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 16,
    query: module.exports.initialCreates[0]
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = module.exports.initialCreates.slice();

