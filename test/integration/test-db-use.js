var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	assert.equal(err, null);

	// initialize plugin
	db.use(MyPlugin, { option: true });

	var calledDefine = false;
	var MyModel = db.define("my_model", { // db.define should call plugin.define method
		property: String
	});

	assert.equal(calledDefine, true);

	db.close();

	function MyPlugin(DB, opts) {
		assert.strictEqual(db, DB);
		assert.deepEqual(opts, { option: true });

		return {
			define: function (Model) {
				assert.equal(typeof Model, "function");
				assert.equal(typeof Model.id, "string");
				calledDefine = true;
			}
		};
	}
});
