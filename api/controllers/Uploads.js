/**
 * @module UploadsController
 */

"use strict";

var fs                = require("fs");
var Log               = require("node-android-logging");
var Mysqlc            = require("../../Mysqlc");
var path              = require("path");
var Q                 = require("q");
var squel             = require("squel");
var Uploads           = require("../../models/Uploads");
var uuid              = require("uuid");
var date              = require("../../util/date");

module.exports = {
  get: get,
  getMultiUploadData: getMultiUploadData,
  getUnmapped: getUnmapped,
  newUpload: newUpload,
  processImage: processImage
};

/**
 * Retrieves the Uploads from the database and returns them via the response.
 */
function get(request, response) {
  Uploads.select(
      request.query.offset,
      request.query.limit,
      request.query.sortField,
      request.query.sortOrder)
  .then(function(uploads) {
    return Uploads.count().then(function(count) {
      return new Q.Promise(function(resolve) {
        response.json({
          "length": uploads.length,
          "results": uploads.map(addUploadLink),
          "count": count[0].count
        });

        resolve();
      });
    });
  }).catch(function(e) {
    defaultErrorHandler(response, e);
  });
}

function getMultiUploadData(request, response) {
  Uploads.getMultiUploadData({
    limit: request.swagger.params.limit.value,
    offset: request.swagger.params.offset.value
  }).then(function(results) {
    return Q.all(results.map(mapMultiUploadData));
  }).then(function(multiUploadData) {
    response.json({
      "length": multiUploadData.length,
      "results": multiUploadData
    });
  }).catch(function(e) {
    defaultErrorHandler(response, e);
  });
}

function mapMultiUploadData(multiUploadData) {
  return new Q.Promise(function(resolve, reject) {
    multiUploadData.img = "/static-stored-files/" + multiUploadData.filename;

    if (!multiUploadData.thumbnail) {
      multiUploadData.thumbnail = "/static-stored-files/thumbnails/" + multiUploadData.filename;
    }

    delete multiUploadData.filename;

    fs.stat("." + multiUploadData.thumbnail, function(err, stats) {
      if (err || !stats.isFile()) {
        createThumbnailFromFile("." + multiUploadData.img, "." + multiUploadData.thumbnail);

        multiUploadData.thumbnail = "/static/img/qmark100x100.png";
      }

      resolve(multiUploadData);
    });
  });
}

function createThumbnail(img, destination, targetWidth, targetHeight) {
  return new Q.Promise(function(resolve, reject) {
    targetWidth = targetWidth || 100;
    targetHeight = targetHeight || 100;

    let scale = Math.max(targetWidth / img.width(), targetHeight / img.height());

    img.batch().scale(scale).crop(100, 100).writeFile(destination, function(err) {
      if (err) {
        reject(err);

        return;
      }

      resolve(destination);
    });
  });
}

function createThumbnailFromFile(source, destination, targetWidth, targetHeight) {
  return new Q.Promise(function(resolve, reject) {
    require("lwip").open(source, function(err, img) {
      if (err) {
        reject(err);

        return;
      }

      resolve(img);
    });
  }).then(function(img) {
    return createThumbnail(img, destination, targetWidth, targetHeight);
  });
}

function getUnmapped(request, response) {
  Uploads.getUnmapped().then(function(uploads) {
    return new Q.Promise(function(resolve) {
      response.json({
        "length": uploads.length,
        "results": uploads.map(addUploadLink)
      });

      resolve();
    });
  }).catch(function(e) {
    defaultErrorHandler(response, e);
  });
}

function defaultErrorHandler(response, rejection) {
  Log.E(rejection);

  response.status(500).json({
    "result": "ERROR",
    "message": "Unable to retrieve uploads"
  });
}

function addUploadLink(result) {
  if (result.serviceName === false) {
    /* No alternate case yet */
  } else {
    /* Default case */
    result.uploadLink = "/static-stored-files/" + result.filename;
  }

  return result;
}

function newUpload(request, response) {
  let file = request.swagger.params.file.originalValue;
  let fname = file.originalname.replace(/\.[^\.]*$/, "-" + date.now() + "$&");
  let thumb = fname;

  let fileUuid = uuid.v4();

  fname = "static-stored-files/" + fileUuid + "-" + fname;
  thumb = "static-stored-files/thumbnails/" + fileUuid + "-" + thumb;

  fs.writeFile(fname, file.buffer, function(err) {
    if (err) {
      Log.E(err);

      defaultErrorHandler(response, err);
    } else {
      Log.T("Wrote: " + fname);

      return createThumbnailFromFile(fname, thumb).then(function(thumbnailFile) {
        let mockBody = {
          results: [
            {
              serviceName: "",
              filename: path.basename(fname),
              uniqid: fileUuid
            }
          ]
        };

        Uploads.postBody(mockBody).then(function(result) {
          Uploads.getMultiUploadData({
            id: result.insertId,
            limit: 1,
            offset: 0
          }).then(function(results) {
            results.forEach(function(result) {
              result.thumbnail = "/" + thumbnailFile;
            });

            return Q.all(results.map(mapMultiUploadData));
          }).then(function(multiUploadData) {
            response.json({
              "length": multiUploadData.length,
              "results": multiUploadData
            });
          }).catch(function(e) {
            defaultErrorHandler(response, e);
          });
        });
      });

      require("lwip").open(fname, function(err, img) {
        if (err) {
          defaultErrorHandler(response, err);

          return;
        }

        let targetWidth = 100.0;
        let targetHeight = 100.0;

        let scale = Math.max(targetWidth / img.width(), targetHeight / img.height());

        img.batch().scale(scale).crop(100, 100).writeFile(thumb, function(err) {
          if (err) {
            defaultErrorHandler(response, {err: err});

            return;
          }

          Log.T("Created a thumbnail " + thumb);

          let mockBody = {
            results: [
              {
                serviceName: "",
                filename: path.basename(fname),
                uniqid: fileUuid
              }
            ]
          };

          Uploads.postBody(mockBody).then(function(result) {
            Uploads.getMultiUploadData({
              id: result.insertId,
              limit: 1,
              offset: 0
            }).then(function(results) {
              return Q.all(results.map(mapMultiUploadData));
            }).then(function(multiUploadData) {
              response.json({
                "length": multiUploadData.length,
                "results": multiUploadData
              });
            }).catch(function(e) {
              defaultErrorHandler(response, e);
            });
          });
        });
      });
    }
  });

}

function processImage(request, response) {
  let rot = parseFloat(request.swagger.params.rotateDegrees.value);

  if (rot === undefined) {
    defaultErrorHandler(response, {msg: "No rotation specified."});

    return;
  }

  let filename = path.dirname(require.main.filename) + request.swagger.params.imageTarget.value;

  require("lwip").open(filename, function(err, img) {
    if (err) {
      defaultErrorHandler(response, err);

      return;
    }

    img.batch().rotate(rot).writeFile(filename, function(err) {
      if (err) {
        defaultErrorHandler(response, {err: err});

        return;
      }

      let thumb = filename.replace(/static-stored-files/, "static-stored-files/thumbnails");

      return createThumbnail(img, thumb).then(function(thumbnailFile) {
        Log.T("Rotated " + filename + " and " + thumbnailFile + " rot=" + rot + " degrees.");

        response.status(200).json({
          "result": "OK"
        });
      });
    });
  });
}

