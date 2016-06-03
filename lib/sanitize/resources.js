var extend             = require('xtend/mutable');
var is                 = require('../utils/is');
var sanitizeTrait      = require('./trait');
var sanitizeParameters = require('./parameters');

/**
 * Sanitize a method into RAML structure for stringification.
 *
 * @param  {Object} method
 * @return {Object}
 */
var sanitizeMethods = function (methods) {
  var obj = {};

  methods.forEach(function (method) {
    var child = obj[method.method.toLowerCase()] = {};

    if (is.array(method.is)) {
      child.is = method.is;
    }

    method.__METADATA__ && delete method.__METADATA__;

    if (method.body) {
      method.body['application/json'] && delete method.body['application/json'].name;
      method.body['application/json'] && delete method.body['application/json'].schemaContent;
      method.body['application/x-www-form-urlencoded'] && delete method.body['application/x-www-form-urlencoded'].name;
      method.body['application/x-www-form-urlencoded'] && delete method.body['application/x-www-form-urlencoded'].schemaContent;
      method.body['multipart/form-data'] && delete method.body['multipart/form-data'].name;
      method.body['multipart/form-data'] && delete method.body['multipart/form-data'].schemaContent;
      method.body['application/xml'] && delete method.body['application/xml'].name;
      method.body['application/xml'] && delete method.body['application/xml'].schemaContent;
      method.body['text/xml'] && delete method.body['text/xml'].name;
      method.body['text/xml'] && delete method.body['text/xml'].schemaContent;
      method.body['"*/*"'] && delete method.body['"*/*"'].name;
      method.body['"*/*"'] && delete method.body['"*/*"'].schemaContent;

      if (method.body['application/x-www-form-urlencoded']) {
        if (method.body['application/x-www-form-urlencoded'].formParameters) {
          for (var prop in method.body['application/x-www-form-urlencoded'].formParameters) {
            for (var subprop in method.body['application/x-www-form-urlencoded'].formParameters[prop]) {
              if (subprop !== 'displayName' || subprop !== 'type' || subprop !== 'required') {
                delete method.body['application/x-www-form-urlencoded'].formParameters[prop][subprop];
              }
            }
          }
        }
      }

      if (method.body['multipart/form-data']) {
        if (method.body['multipart/form-data'].formParameters) {
          for (var prop in method.body['multipart/form-data'].formParameters) {
            for (var subprop in method.body['multipart/form-data'].formParameters[prop]) {
              if (subprop !== 'displayName' || subprop !== 'type' || subprop !== 'required') {
                delete method.body['multipart/form-data'].formParameters[prop][subprop];
              }
            }
          }
        }
      }
    }

    extend(child, sanitizeTrait(method));
  });

  return obj;
};

/**
 * Sanitize the resources array to the correct RAML structure.
 *
 * @param  {Array}  resources
 * @return {Object}
 */
module.exports = function sanitizeResources (resources) {
  var obj = {};

  resources.forEach(function (resource) {
    var child = obj;

    if (resource.relativeUri) {
      child = obj[resource.relativeUri] = obj[resource.relativeUri] || {};
    }

    if (resource.uriParameters) {
      child.uriParameters = sanitizeParameters(resource.uriParameters);
    }

    if (is.string(resource.type) || is.object(resource.type)) {
      child.type = resource.type;
    }

    if (is.array(resource.is)) {
      child.is = resource.is;
    }

    if (is.string(resource.description)) {
      child.description = resource.description;
    }

    if (is.array(resource.methods)) {
      extend(child, sanitizeMethods(resource.methods));
    }

    if (is.array(resource.resources)) {
      extend(child, sanitizeResources(resource.resources));
    }
  });

  return obj;
};
