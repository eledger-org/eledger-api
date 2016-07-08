/**
 * @module Date
 *
 * Provides commonly used date functions
 */

/**
 * @returns the current time as a unix time.
 */
module.exports.now = function() {
  return Math.floor((new Date()).getTime() / 1000);
};

