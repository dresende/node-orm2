module.exports = function MyPlugin(DB, opts) {
	opts.option.should.be.true;
	opts.calledDefine.should.be.false;

	return {
		define: function (Model) {
			Model.should.be.a("function");
			Model.id.should.be.a("object");
			Model.id[0].should.be.a("string");

			opts.calledDefine = true;
		},
		beforeDefine: function (model_name, model_props, model_opts) {
			if (opts.beforeDefine) {
				opts.beforeDefine(model_name, model_props, model_opts);
			}
		}
	};
};
