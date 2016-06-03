(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ramlObjectToRaml = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var is = require('../utils/is');

/**
 * Sanitize documentation for RAML.
 *
 * @param  {Array} documentation
 * @return {Array}
 */
module.exports = function (documentation) {
  return documentation.filter(function (document) {
    return is.string(document.title) && is.string(document.content);
  }).map(function (document) {
    return {
      title:   document.title,
      content: document.content
    };
  });
};

},{"../utils/is":13}],2:[function(require,module,exports){
var extend                  = require('xtend/mutable');
var is                      = require('../utils/is');
var sanitizeSchemas         = require('./schemas');
var sanitizeParameters      = require('./parameters');
var sanitizeDocumentation   = require('./documentation');
var sanitizeSecuritySchemes = require('./security-schemes');
var sanitizeResources       = require('./resources');
var sanitizeResourceTypes   = require('./resource-types');
var sanitizeTraits          = require('./traits');
var sanitizeSecuredBy       = require('./secured-by');

/**
 * Transform a RAML object into a YAML compatible structure.
 *
 * @param  {Object} input
 * @return {Object}
 */
module.exports = function (input) {
  var output = {};

  if (is.string(input.title)) {
    output.title = input.title;
  }

  if (is.string(input.version) || is.number(input.version)) {
    output.version = input.version;
  }

  if (is.string(input.mediaType)) {
    output.mediaType = input.mediaType;
  }

  if (is.string(input.baseUri)) {
    output.baseUri = input.baseUri;
  }

  if (is.object(input.baseUriParameters)) {
    output.baseUriParameters = sanitizeParameters(input.baseUriParameters);
  }

  if (is.array(input.documentation)) {
    output.documentation = sanitizeDocumentation(input.documentation);
  }

  if (is.array(input.securitySchemes)) {
    output.securitySchemes = sanitizeSecuritySchemes(input.securitySchemes);
  }

  if (is.array(input.schemas)) {
    output.schemas = sanitizeSchemas(input.schemas);
  }

  if (is.array(input.resourceTypes)) {
    output.resourceTypes = sanitizeResourceTypes(input.resourceTypes);
  }

  if (is.array(input.traits)) {
    output.traits = sanitizeTraits(input.traits);
  }

  if (is.array(input.securedBy)) {
    output.securedBy = sanitizeSecuredBy(input.securedBy);
  }

  if (is.array(input.resources)) {
    extend(output, sanitizeResources(input.resources));
  }

  return output;
};

},{"../utils/is":13,"./documentation":1,"./parameters":3,"./resource-types":4,"./resources":5,"./schemas":7,"./secured-by":8,"./security-schemes":9,"./traits":11,"xtend/mutable":22}],3:[function(require,module,exports){
var extend = require('xtend/mutable');
var is     = require('../utils/is');

/**
 * Map of valid types.
 *
 * @type {Object}
 */
var TYPES = {
  string:  true,
  number:  true,
  integer: true,
  date:    true,
  boolean: true,
  file:    true
};

/**
 * Sanitize a single parameter representation.
 *
 * @param  {Object} param
 * @param  {String} key
 * @return {Object}
 */
var sanitizeParameter = function (param, key) {
  var obj = {};

  // Avoid unneccessary display names.
  if (is.string(param.displayName) && key !== param.displayName) {
    obj.displayName = param.displayName;
  }

  if (is.string(param.type) && TYPES.hasOwnProperty(param.type)) {
    obj.type = param.type;
  }

  if (is.string(param.description)) {
    obj.description = param.description;
  }

  if (is.array(param.enum)) {
    obj.enum = param.enum;
  }

  if (is.string(param.pattern)) {
    obj.pattern = param.pattern;
  }

  if (is.number(param.minLength)) {
    obj.minLength = param.minLength;
  }

  if (is.number(param.maxLength)) {
    obj.maxLength = param.maxLength;
  }

  if (is.number(param.minimum)) {
    obj.minimum = param.minimum;
  }

  if (is.number(param.maximum)) {
    obj.maximum = param.maximum;
  }

  if (param.example != null && is.primitive(param.example)) {
    obj.example = param.example;
  }

  if (param.default != null && is.primitive(param.default)) {
    obj.default = param.default;
  }

  if (is.boolean(param.repeat)) {
    obj.repeat = param.repeat;
  }

  if (is.boolean(param.required)) {
    obj.required = param.required;
  }

  return obj;
};

/**
 * Sanitize parameters and ensure the object structure is correct.
 *
 * @param  {Object} params
 * @return {Object}
 */
module.exports = function (params) {
  var obj = {};

  Object.keys(params).forEach(function (key) {
    var param = params[key];

    if (is.array(param)) {
      return obj[key] = param.map(sanitizeParameter);
    }

    obj[key] = sanitizeParameter(param, key);
  });

  return obj;
};

},{"../utils/is":13,"xtend/mutable":22}],4:[function(require,module,exports){
var is            = require('../utils/is');
var sanitizeTrait = require('./trait');

/**
 * Escape characters used inside a method name for the regexp.
 *
 * @param  {String} str
 * @return {String}
 */
var escape = function (str) {
  return str.replace(/([\-])/g, '\\$1');
};

/**
 * Check if the key is potentially a method name.
 *
 * @type {RegExp}
 */
var METHOD_KEY_REGEXP = /^(?:GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)\??$/i;

/**
 * Sanitize resource types suitable for RAML.
 *
 * @param  {Array} resourceTypes
 * @return {Array}
 */
module.exports = function (resourceTypes) {
  var array = [];

  resourceTypes.forEach(function (resourceTypeMap) {
    Object.keys(resourceTypeMap).forEach(function (type) {
      var obj          = {};
      var child        = obj[type] = {};
      var resourceType = resourceTypeMap[type];

      Object.keys(resourceType).forEach(function (key) {
        var value = resourceType[key];
        var keys  = ['type', 'usage', 'description'];

        if (METHOD_KEY_REGEXP.test(key)) {
          child[key] = value == null ? value : sanitizeTrait(value);
        }

        // Allow usage and description strings alongside methods.
        if (~keys.indexOf(key) && is.string(value)) {
          child[key] = value;
        }
      });

      array.push(obj);
    });
  });

  return array;
};

},{"../utils/is":13,"./trait":10}],5:[function(require,module,exports){
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

},{"../utils/is":13,"./parameters":3,"./trait":10,"xtend/mutable":22}],6:[function(require,module,exports){
/**
 * Sanitize the responses object.
 *
 * @param  {Object} responses
 * @return {Object}
 */
module.exports = function (responses) {
  var obj = {};

  Object.keys(responses).forEach(function (code) {
    if (!/^\d{3}$/.test(code)) {
      return;
    }

    if (responses[code]) {
      responses[code].code && delete responses[code].code;
    }

    if (responses[code].body) {
      responses[code].body['application/json'] && delete responses[code].body['application/json'].name;
      responses[code].body['application/json'] && delete responses[code].body['application/json'].schemaContent;
      responses[code].body['application/x-www-form-urlencoded'] && delete responses[code].body['application/x-www-form-urlencoded'].name;
      responses[code].body['application/x-www-form-urlencoded'] && delete responses[code].body['application/x-www-form-urlencoded'].schemaContent;
      responses[code].body['multipart/form-data'] && delete responses[code].body['multipart/form-data'].name;
      responses[code].body['multipart/form-data'] && delete responses[code].body['multipart/form-data'].schemaContent;
      responses[code].body['application/xml'] && delete responses[code].body['application/xml'].name;
      responses[code].body['application/xml'] && delete responses[code].body['application/xml'].schemaContent;
      responses[code].body['text/xml'] && delete responses[code].body['text/xml'].name;
      responses[code].body['text/xml'] && delete responses[code].body['text/xml'].schemaContent;
      responses[code].body['"*/*"'] && delete responses[code].body['"*/*"'].name;
      responses[code].body['"*/*"'] && delete responses[code].body['"*/*"'].schemaContent;
    }

    obj[code] = responses[code];
  });

  return obj;
};

},{}],7:[function(require,module,exports){
var is = require('../utils/is');

/**
 * Map the schemas array of objects into a standard array.
 *
 * @param  {Array} schemas
 * @return {Array}
 */
module.exports = function (schemas) {
  var array = [];

  // Iterate over the schema array and object and make it one schema per index.
  schemas.forEach(function (schemaMap) {
    Object.keys(schemaMap).forEach(function (key) {
      if (!is.string(schemaMap[key])) {
        return;
      }

      var obj = {};

      obj[key] = schemaMap[key];

      array.push(obj);
    });
  });

  return array;
};

},{"../utils/is":13}],8:[function(require,module,exports){
var is = require('../utils/is');

/**
 * Sanitize a secured by array.
 *
 * @param  {Array} securedBy
 * @return {Array}
 */
module.exports = function (securedBy) {
  return securedBy.filter(function (value) {
    return is.null(value) || is.object(value) || is.string(value);
  });
}

},{"../utils/is":13}],9:[function(require,module,exports){
var is            = require('../utils/is');
var sanitizeTrait = require('./trait');

/**
 * Map of valid authentication types.
 *
 * @type {Object}
 */
var AUTH_TYPES = {
  'Basic Authentication':  true,
  'Digest Authentication': true,
  'OAuth 1.0':             true,
  'OAuth 2.0':             true
};

/**
 * Sanitize security schemes.
 *
 * @param  {Array} securitySchemes
 * @return {Array}
 */
module.exports = function (securitySchemes) {
  var array = [];

  securitySchemes.forEach(function (schemeMap) {
    Object.keys(schemeMap).forEach(function (key) {
      var scheme = schemeMap[key];

      if (!AUTH_TYPES[scheme.type] && !/^x-/i.test(scheme.type)) {
        return;
      }

      var obj  = {};
      var data = obj[key] = { type: scheme.type };

      if (is.string(scheme.description)) {
        data.description = scheme.description;
      }

      if (is.object(scheme.describedBy)) {
        data.describedBy = sanitizeTrait(scheme.describedBy);
      }

      if (is.object(scheme.settings)) {
        data.settings = scheme.settings;
      }

      array.push(obj);
    });
  });

  return array;
};

},{"../utils/is":13,"./trait":10}],10:[function(require,module,exports){
var is                 = require('../utils/is');
var sanitizeResponses  = require('./responses');
var sanitizeParameters = require('./parameters');
var sanitizeSecuredBy  = require('./secured-by');

/**
 * Sanitize a trait-like object.
 *
 * @param  {Object} trait
 * @return {Object}
 */
module.exports = function (trait) {
  var obj = {};

  if (is.string(trait.usage)) {
    obj.usage = trait.usage;
  }

  if (is.string(trait.description)) {
    obj.description = trait.description;
  }

  if (is.object(trait.headers)) {
    obj.headers = sanitizeParameters(trait.headers);
  }

  if (is.object(trait.queryParameters)) {
    obj.queryParameters = sanitizeParameters(trait.queryParameters);
  }

  if (is.object(trait.body)) {
    obj.body = trait.body;
  }

  if (is.object(trait.responses)) {
    obj.responses = sanitizeResponses(trait.responses);
  }

  if (is.array(trait.securedBy)) {
    obj.securedBy = sanitizeSecuredBy(trait.securedBy)
  }

  return obj;
};

},{"../utils/is":13,"./parameters":3,"./responses":6,"./secured-by":8}],11:[function(require,module,exports){
var sanitizeTrait = require('./trait');

/**
 * Sanitize traits into an array of keyed maps.
 *
 * @param  {Array} traits
 * @return {Array}
 */
module.exports = function (traits) {
  var array = [];

  traits.forEach(function (traitMap) {
    Object.keys(traitMap).forEach(function (key) {
      var obj = {};

      obj[key] = sanitizeTrait(traitMap[key]);

      array.push(obj);
    });
  });

  return array;
};

},{"./trait":10}],12:[function(require,module,exports){
var extend   = require('xtend/mutable');
var indent   = require('indent-string');
var repeat   = require('repeat-string');
var length   = require('string-length');
var is       = require('./utils/is');
var toString = Function.prototype.call.bind(Object.prototype.toString);

/**
 * Map of characters to escape character sequences.
 *
 * Reference: https://github.com/nodeca/js-yaml/blob/7bbbb863c9c696311d149693a34f4dec20616cc2/lib/js-yaml/dumper.js#L39-L55
 *
 * @type {Object}
 */
var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

/**
 * Quickly check wheter a character code needs to be quoted within a string.
 *
 * Reference: https://github.com/nodeca/js-yaml/blob/7bbbb863c9c696311d149693a34f4dec20616cc2/lib/js-yaml/dumper.js#L14-L36
 *
 * @type {Object}
 */
var QUOTED_CHARACTERS = {};

QUOTED_CHARACTERS[0x09] = true; /* Tab */
QUOTED_CHARACTERS[0x0A] = true; /* LF */
QUOTED_CHARACTERS[0x0D] = true; /* CR */
QUOTED_CHARACTERS[0x21] = true; /* ! */
QUOTED_CHARACTERS[0x22] = true; /* " */
QUOTED_CHARACTERS[0x23] = true; /* # */
QUOTED_CHARACTERS[0x25] = true; /* % */
QUOTED_CHARACTERS[0x26] = true; /* & */
QUOTED_CHARACTERS[0x27] = true; /* ' */
QUOTED_CHARACTERS[0x2A] = true; /* * */
// QUOTED_CHARACTERS[0x2C] = true; /* , */
// QUOTED_CHARACTERS[0x3A] = true; /* : */
QUOTED_CHARACTERS[0x3E] = true; /* > */
QUOTED_CHARACTERS[0x40] = true; /* @ */
QUOTED_CHARACTERS[0x5B] = true; /* [ */
QUOTED_CHARACTERS[0x5D] = true; /* ] */
QUOTED_CHARACTERS[0x60] = true; /* ` */
QUOTED_CHARACTERS[0x7B] = true; /* { */
QUOTED_CHARACTERS[0x7C] = true; /* | */
QUOTED_CHARACTERS[0x7D] = true; /* } */

/**
 * Check if numbers match the YAML number pattern.
 *
 * Reference: https://github.com/nodeca/js-yaml/blob/6030fa6c389aaf14545222f7fa27e86359ca3a3b/lib/js-yaml/type/float.js#L6-L11
 *
 * @type {RegExp}
 */
var NUMBER_REGEXP = new RegExp(
  '^(?:[-+]?(?:[0-9][0-9_]*)' +
  '|[-+]?(?:[0-9][0-9_]*)\\.[0-9_]*(?:[eE][-+][0-9]+)?' +
  '|\\.[0-9_]+(?:[eE][-+][0-9]+)?' +
  '|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*' +
  '|[-+]?\\.(?:inf|Inf|INF)' +
  '|\\.(?:nan|NaN|NAN))$'
);

/**
 * Encode a character code in hex form.
 *
 * Reference: https://github.com/nodeca/js-yaml/blob/7bbbb863c9c696311d149693a34f4dec20616cc2/lib/js-yaml/dumper.js#L95-L114
 *
 * @param  {Number} charCode
 * @return {String}
 */
var encodeHex = function (charCode) {
  var string = charCode.toString(16).toUpperCase();
  var handle;
  var length;

  if (charCode <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (charCode <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (charCode <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new Error(
      'Character code within a string may not be greater than 0xFFFFFFFF'
    );
  }

  return '\\' + handle + repeat('0', length - string.length) + string;
};

/**
 * Return whether a character code needs to be escaped.
 *
 * @param  {Number}  charCode
 * @return {Boolean}
 */
var requiresEscape = function (charCode) {
  return ESCAPE_SEQUENCES[charCode] ||
    !((0x00020 <= charCode && charCode <= 0x00007E) ||
      (0x00085 === charCode)                        ||
      (0x000A0 <= charCode && charCode <= 0x00D7FF) ||
      (0x0E000 <= charCode && charCode <= 0x00FFFD) ||
      (0x10000 <= charCode && charCode <= 0x10FFFF));
};

/**
 * Check whether a string requires quotes in RAML.
 *
 * @param  {String}  str
 * @return {Boolean}
 */
var requiresQuotes = function (str) {
  // Empty strings require quotes.
  if (length(str) === 0) {
    return true;
  }

  // Check whether it's surrounded by spaces or starts with `-` or `?`.
  if (/^[ \-?]| $/.test(str) || NUMBER_REGEXP.test(str)) {
    return true;
  }

  for (var i = 0; i < str.length; i++) {
    var charCode = str.charCodeAt(i);

    if (requiresEscape(charCode)) {
      return true;
    }

    if (QUOTED_CHARACTERS[charCode]) {
      return true;
    }
  }

  return false;
};

/**
 * Escape a string to be wrapped in quotes.
 *
 * @param  {String} str
 * @return {String}
 */
var escapeString = function (str) {
  return str.split('').map(function (character) {
    var charCode = character.charCodeAt(0);

    if (requiresEscape(charCode)) {
      return ESCAPE_SEQUENCES[charCode] || escapeHex(charCode);
    }

    return character;
  }).join('');
};

/**
 * Wrap a string in quotes and escape.
 *
 * @param  {String} str
 * @return {String}
 */
var wrapString = function (str) {
  return '"' + escapeString(str) + '"';
};

/**
 * Stringify a string into RAML.
 *
 * @param  {String} str
 * @return {String}
 */
var stringifyString = function (str) {
  if (requiresQuotes(str)) {
    return wrapString(str);
  }

  if (str === 'null' || str === 'true' || str === 'false') {
    return wrapString(str);
  }

  return str;
};

/**
 * Check whether an inline RAML array can be rendered with the max length.
 *
 * @param  {Array}   array
 * @param  {Number}  length
 * @param  {Object}  opts
 * @return {Boolean}
 */
var arrayWithinLength = function (array, maxLength, opts) {
  // Empty arrays must always be true.
  if (!array.length) {
    return true;
  }

  // Surrounding brackets and every comma separator - "[ ... ]".
  var total = 4 + (array.length - 1) * 2;

  return array.every(function (value) {
    if (!is.primitive(value)) {
      return false;
    }

    total += length(stringify(value, 0, opts));

    return total < maxLength;
  });
};

/**
 * Stringify an array using the inline RAML format.
 *
 * @param  {Array}  array
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringifyArrayInline = function (array, level, opts) {
  if (!array.length) {
    return '[]';
  }

  return '[ ' + array.map(function (value) {
    if (is.string(value) && value.indexOf(':') > -1) {
      return wrapString(value);
    }

    if (is.null(value)) {
      return 'null';
    }

    return stringify(value, level, opts);
  }).join(', ') + ' ]';
};

/**
 * Check whether a string fits within the designated width.
 *
 * @param  {String}  str
 * @param  {Number}  maxLength
 * @param  {Object}  opts
 * @return {Boolean}
 */
var stringWithinLength = function (str, maxLength, opts) {
  if (/\r?\n/.test(str)) {
    return false;
  }

  return length(stringifyString(str)) < maxLength;
};

/**
 * Stringify a string into RAML with support for multiple lines.
 *
 * @param  {String} str
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringifyStringMultiLine = function (str, level, opts) {
  return indent(str, opts.indent, level);
};

/**
 * Generalized property stringification.
 *
 * @param  {String} prefix
 * @param  {*}      value
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringifyProperty = function (prefix, value, level, opts) {
  var maxLength = opts.maxLength - length(prefix) - 1;

  // Empty values can stay empty in RAML.
  if (value == null) {
    return prefix;
  }

  // Check whether the array can fit using inline representation.
  if (is.array(value) && arrayWithinLength(value, maxLength, opts)) {
    return prefix + ' ' + stringifyArrayInline(value, level + 1, opts);
  }

  // Check whether strings should be on a single line.
  if (is.string(value) && !stringWithinLength(value, maxLength, opts)) {
    return prefix + ' |\n' + stringifyStringMultiLine(value, level + 1, opts);
  }

  // Inline object representation when empty.
  if (is.object(value) && !Object.keys(value).length) {
    return prefix + ' {}';
  }

  // All other primitives will fit inline.
  if (is.primitive(value)) {
    return prefix + ' ' + stringify(value, level + 1, opts);
  }

  return prefix + '\n' + stringify(value, level + 1, opts);
};

/**
 * Stringify an object property for RAML.
 *
 * @param  {String} key
 * @param  {*}      value
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringifyObjectProperty = function (key, value, level, opts) {
  var prefix = repeat(opts.indent, level) + key + ':';

  return stringifyProperty(prefix, value, level, opts);
};

/**
 * Stringify an object for RAML.
 *
 * @param  {Object} obj
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringifyObject = function (obj, level, opts) {
  var keys = Object.keys(obj);

  return keys.map(function (key) {
    return stringifyObjectProperty(key, obj[key], level, opts);
  }).join('\n');
};

/**
 * Stringify an array property for RAML.
 *
 * @param  {*}      value
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringifyArrayProperty = function (value, level, opts) {
  var prefix = repeat(opts.indent, level) + '-';

  // Represent objects inline with the array token. E.g. "- schema: test".
  if (is.object(value)) {
    return prefix + ' ' + stringify(value, level + 1, opts).replace(/^ +/, '');
  }

  if (is.string(value) && value.indexOf(':') > -1) {
    return prefix + ' ' + wrapString(value);
  }

  if (is.null(value)) {
    return prefix + ' null';
  }

  return stringifyProperty(prefix, value, level, opts);
};

/**
 * Stringify an array for RAML.
 *
 * @param  {Array}  array
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringifyArray = function (array, level, opts) {
  return array.map(function (value) {
    return stringifyArrayProperty(value, level, opts);
  }).join('\n');
};

/**
 * Map of types to stringify.
 *
 * @type {Object}
 */
var TYPES = {
  '[object String]':  stringifyString,
  '[object Object]':  stringifyObject,
  '[object Array]':   stringifyArray,
  '[object Number]':  String,
  '[object Boolean]': String
};

/**
 * Stringify any JavaScript type.
 *
 * @param  {*}      input
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
var stringify = function (input, level, opts) {
  var type = toString(input);

  if (!TYPES[type]) {
    return '';
  }

  return TYPES[type](input, level, opts);
};

/**
 * Stringify JavaScript to a YAML (RAML) string.
 *
 * @param  {*}      input
 * @param  {Number} level
 * @param  {Object} opts
 * @return {String}
 */
module.exports = function (input, opts) {
  return stringify(input, 0, extend({
    indent:    '  ',
    maxLength: 80
  }, opts));
};

},{"./utils/is":13,"indent-string":14,"repeat-string":18,"string-length":19,"xtend/mutable":22}],13:[function(require,module,exports){
var is        = exports;
var _toString = Object.prototype.toString;

[
  'String',
  'Number',
  'Boolean',
  'RegExp',
  'Object',
  'Array',
  'Function',
  'Null',
  'Undefined'
].forEach(function (instance) {
  var name = instance.charAt(0).toLowerCase() + instance.substr(1);
  var type = '[object ' + instance + ']';

  is[name] = function (value) {
    return _toString.call(value) === type;
  };
});

/**
 * Map of primitive types.
 *
 * @type {Object}
 */
var PRIMITIVES = {
  '[object Number]':    true,
  '[object String]':    true,
  '[object Boolean]':   true,
  '[object Null]':      true,
  '[object Undefined]': true
};

/**
 * Check whether a value is a primitive JavaScript type.
 *
 * @param  {*}       value
 * @return {Boolean}
 */
is.primitive = function (value) {
  return !!PRIMITIVES[_toString.call(value)];
}

},{}],14:[function(require,module,exports){
'use strict';
var repeating = require('repeating');

module.exports = function (str, indent, count) {
	if (typeof str !== 'string' || typeof indent !== 'string') {
		throw new TypeError('`string` and `indent` should be strings');
	}

	if (count != null && typeof count !== 'number') {
		throw new TypeError('`count` should be a number');
	}

	if (count === 0) {
		return str;
	}

	indent = count > 1 ? repeating(indent, count) : indent;

	return str.replace(/^(?!\s*$)/mg, indent);
};

},{"repeating":15}],15:[function(require,module,exports){
'use strict';
var isFinite = require('is-finite');

module.exports = function (str, n) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected `input` to be a string');
	}

	if (n < 0 || !isFinite(n)) {
		throw new TypeError('Expected `count` to be a positive finite number');
	}

	var ret = '';

	do {
		if (n & 1) {
			ret += str;
		}

		str += str;
	} while ((n >>= 1));

	return ret;
};

},{"is-finite":16}],16:[function(require,module,exports){
'use strict';
var numberIsNan = require('number-is-nan');

module.exports = Number.isFinite || function (val) {
	return !(typeof val !== 'number' || numberIsNan(val) || val === Infinity || val === -Infinity);
};

},{"number-is-nan":17}],17:[function(require,module,exports){
'use strict';
module.exports = Number.isNaN || function (x) {
	return x !== x;
};

},{}],18:[function(require,module,exports){
/*!
 * repeat-string <https://github.com/jonschlinkert/repeat-string>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

/**
 * Results cache
 */

var res = '';
var cache;

/**
 * Expose `repeat`
 */

module.exports = repeat;

/**
 * Repeat the given `string` the specified `number`
 * of times.
 *
 * **Example:**
 *
 * ```js
 * var repeat = require('repeat-string');
 * repeat('A', 5);
 * //=> AAAAA
 * ```
 *
 * @param {String} `string` The string to repeat
 * @param {Number} `number` The number of times to repeat the string
 * @return {String} Repeated string
 * @api public
 */

function repeat(str, num) {
  if (typeof str !== 'string') {
    throw new TypeError('repeat-string expects a string.');
  }

  // cover common, quick use cases
  if (num === 1) return str;
  if (num === 2) return str + str;

  var max = str.length * num;
  if (cache !== str || typeof cache === 'undefined') {
    cache = str;
    res = '';
  }

  while (max > res.length && num > 0) {
    if (num & 1) {
      res += str;
    }

    num >>= 1;
    if (!num) break;
    str += str;
  }

  return res.substr(0, max);
}


},{}],19:[function(require,module,exports){
'use strict';
var stripAnsi = require('strip-ansi');

module.exports = function (str) {
	var reAstral = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;

	return stripAnsi(str).replace(reAstral, ' ').length;
};

},{"strip-ansi":20}],20:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":21}],21:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
};

},{}],22:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],23:[function(require,module,exports){
var sanitize  = require('./lib/sanitize');
var stringify = require('./lib/stringify');

/**
 * Transform a RAML object into a RAML string.
 *
 * @param  {Object} obj
 * @return {String}
 */
module.exports = function (obj) {
  return '#%RAML 0.8\n' + stringify(sanitize(obj));
};

},{"./lib/sanitize":2,"./lib/stringify":12}]},{},[23])(23)
});