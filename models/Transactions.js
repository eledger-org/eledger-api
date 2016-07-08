/**
 * @module  Transactions
 * @extends DefaultModelActions
 */

"use strict";

var defaultModel      = require("./DefaultModelActions");
var Mysqlc            = require("../Mysqlc");
var squel             = require("squel");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "Transactions";

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE Transactions (
  id                    BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  vendor                VARCHAR(255)      DEFAULT NULL,
  vendorIdentifier      VARCHAR(255)      DEFAULT NULL,
  vehicle               VARCHAR(255)      DEFAULT NULL,
  mileage               VARCHAR(255)      DEFAULT NULL,
  address               VARCHAR(255)      DEFAULT NULL,
  city                  VARCHAR(255)      DEFAULT NULL,
  state                 VARCHAR(255)      DEFAULT NULL,
  zip                   VARCHAR(255)      DEFAULT NULL,
  country               VARCHAR(255)      DEFAULT NULL,
  phone                 VARCHAR(255)      DEFAULT NULL,
  recipient             VARCHAR(255)      DEFAULT NULL,
  last4                 VARCHAR(255)      DEFAULT NULL,
  cardType              VARCHAR(255)      DEFAULT NULL,
  barcodes              VARCHAR(16536)    DEFAULT NULL,
  authorizatonCode      VARCHAR(255)      DEFAULT NULL,
  recurrenceFrequency   VARCHAR(255)      DEFAULT NULL,
  tags                  VARCHAR(32768)    DEFAULT NULL,
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
    sortFloatIndex: 17,
    query: module.exports.initialCreates[0]
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = [
  module.exports.initialCreates[0]
];

