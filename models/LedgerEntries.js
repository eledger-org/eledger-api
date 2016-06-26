"use strict";

var defaultModel      = require("./DefaultModelActions");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "LedgerEntries";

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE LedgerEntries (
  id                    BIGINT UNSIGNED   AUTO_INCREMENT,
  generalLedgerDate     BIGINT UNSIGNED   NOT NULL,
  description           VARCHAR(255)      NOT NULL,
  account               VARCHAR(255)      NOT NULL,
  reconciled            VARCHAR(255)      DEFAULT "NO",
  credit                BIGINT            DEFAULT 0,
  debit                 BIGINT            DEFAULT 0,
  createdDate           BIGINT UNSIGNED   NOT NULL,
  createdBy             BIGINT UNSIGNED   NOT NULL,
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL,
  PRIMARY KEY (id)
)
`,
`
CREATE FUNCTION bigintCurrencyString(bigintInput BIGINT, decimalPlaces INT)
  RETURNS CHAR(20) DETERMINISTIC
  BEGIN
    DECLARE inputChar CHAR(20);
    DECLARE length    INT;
    DECLARE currency  CHAR(20);

    SET inputChar = CAST(ROUND(bigintInput, -5 + decimalPlaces) AS char);
    SET length    = LENGTH(inputChar);

    IF (length > 5) THEN
      SET currency = CONCAT(LEFT(inputChar, length - 5), ".", MID(inputChar, length - 5, decimalPlaces));
    ELSE
      SET currency = CONCAT("0.", LEFT(LPAD(inputChar, 5, "0"), decimalPlaces));
    END IF;

    return currency;
  END
` ];

/************************************************************************************************************
 * Migrate Statements.
 ***********************************************************************************************************/
module.exports.migrates = [
  {
    sortFloatIndex: 10,
    query: module.exports.initialCreates[0]
  },
  {
    sortFloatIndex: 11,
    query: module.exports.initialCreates[1]
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = module.exports.initialCreates.slice();

