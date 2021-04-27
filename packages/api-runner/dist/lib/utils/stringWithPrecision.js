'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function stringWithPrecision(val, options = {}) {
  let precision = 2;

  if (options.precision !== undefined) {
    precision = options.precision;
  }

  val = val.toString();

  if (val && typeof val.indexOf === 'function') {
    return val.substr(0, val.indexOf('.') + precision + 1);
  } else {
    return val;
  }
}

exports.stringWithPrecision = stringWithPrecision;
