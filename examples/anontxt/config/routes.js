
var controllers = require('../app/controllers')

module.exports = function (app) {
  app.get( '/'                           , controllers.home);
  app.get( '/messages'                   , controllers.messages.list);
  app.post('/messages'                   , controllers.messages.create);
  app.get( '/message/:id'                , controllers.messages.get);
  app.post('/message/:messageId/comments', controllers.comments.create);
};
