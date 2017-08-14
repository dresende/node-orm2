module.exports = function MyPlugin(DB, opts) {
  opts.option.should.be.true;
  opts.calledDefine.should.be.false;

  return {
    define: function (Model) {
      Model.should.be.a.Function();
      Model.id.should.be.a.Object();
      Model.id[0].should.be.a.String();

      opts.calledDefine = true;
    },
    beforeDefine: function (model_name, model_props, model_opts) {
      if (opts.beforeDefine) {
        opts.beforeDefine(model_name, model_props, model_opts);
      }
    }
  };
};
