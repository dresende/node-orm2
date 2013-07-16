module.exports = function MyPlugin(DB, opts) {
	opts.should.eql({ option: true, calledDefine: false });

	return {
		define: function (Model) {
			Model.should.be.a("function");
			Model.id.should.be.a("object");
			Model.id[0].should.be.a("string");

			opts.calledDefine = true;
		}
	};
};
