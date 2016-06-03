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
