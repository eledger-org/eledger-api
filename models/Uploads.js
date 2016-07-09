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

