var _       = require('lodash');
var helpers = require('./_helpers');
var orm     = require('../../../../');

module.exports = {
  create: function (req, res, next) {
    var params = _.pick(req.body, 'author', 'body');

    req.models.message.get(req.params.messageId, function (err, message) {
      if (err) {
        if (err.code == orm.ErrorCodes.NOT_FOUND) {
          res.send(404, "Message not found");
        } else {
          return next(err);
        }
      }

      params.message_id = message.id;

      req.models.comment.create(params, function (err, message) {
        if(err) {
          if(Array.isArray(err)) {
            return res.send(200, { errors: helpers.formatErrors(err) });
          } else {
            return next(err);
          }
        }

        return res.send(200, message.serialize());
      });
    });
  }
};
