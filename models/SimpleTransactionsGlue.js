/**
 * @module  SimpleTransactionsGlue
 * @extends DefaultModelActions
 */

"use strict";

var defaultModel      = require("./DefaultModelActions");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "SimpleTransactionsGlue";

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

/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 15,
    query: module.exports.initialCreates[0]
  },
  {
    sortFloatIndex: 19,
    query: `
ALTER   TABLE   SimpleTransactionsGlue
CHANGE  COLUMN  transactionNumber
  transactionId         BIGINT UNSIGNED   DEFAULT NULL;
`
  },
  {
    sortFloatIndex: 20,
    query: `
ALTER TABLE SimpleTransactionsGlue
DROP  COLUMN transactionDate;
DROP  COLUMN reconciled;
DROP  COLUMN exchange;
`
  },
  {
    sortFloatIndex: 21,
    query: `
INSERT INTO Transactions
(id, createdDate, createdBy, modifiedDate, modifiedBy, deletedDate, deletedBy)
SELECT
transactionId,
MIN(createdDate), MIN(createdBy), MIN(modifiedDate),
MIN(modifiedBy), MIN(deletedDate), MIN(deletedBy)
FROM SimpleTransactionsGlue
GROUP BY transactionId
`
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = module.exports.initialCreates.slice();

