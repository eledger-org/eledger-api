"use strict";

var defaultModel      = require("./DefaultModelActions");

for (var prop in defaultModel) {
  module.exports[prop] = defaultModel[prop];
}

module.exports.tName = "UploadReadings";

/************************************************************************************************************
 * Initial Create Statements.
 ***********************************************************************************************************/
module.exports.initialCreates = [ `
CREATE TABLE UploadReadings (
  id                    BIGINT UNSIGNED   AUTO_INCREMENT,
  uploadsId             BIGINT UNSIGNED   NOT NULL,
  ocrParamsJson         VARCHAR(255)      NOT NULL,
  dataJson              VARCHAR(60000)    NOT NULL,
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
    sortFloatIndex: 4,
    query: module.exports.initialCreates[0]
  },
  {
    sortFloatIndex: 5,
    query: `
ALTER TABLE UploadReadings
MODIFY COLUMN ocrParamsJson   JSON              NOT NULL,
MODIFY COLUMN dataJson        JSON              NOT NULL;
`
  }
];

/************************************************************************************************************
 * Final Create Statements.
 ***********************************************************************************************************/
module.exports.finalCreates = [ `
CREATE TABLE UploadReadings (
  id                    BIGINT UNSIGNED   AUTO_INCREMENT,
  uploadsId             BIGINT UNSIGNED   NOT NULL,
  ocrParamsJson         JSON              NOT NULL,
  dataJson              JSON              NOT NULL,
  createdDate           BIGINT UNSIGNED   NOT NULL,
  createdBy             BIGINT UNSIGNED   NOT NULL,
  modifiedDate          BIGINT UNSIGNED   DEFAULT NULL,
  modifiedBy            BIGINT UNSIGNED   DEFAULT NULL,
  deletedDate           BIGINT UNSIGNED   DEFAULT NULL,
  deletedBy             BIGINT UNSIGNED   DEFAULT NULL,
  PRIMARY KEY (id)
);
` ];
