var common     = require('../common');
var assert     = require('assert');

common.ORM.settings.set("some.sub.object", 123.45);

assert.equal(common.ORM.settings.get("some.sub.object"), 123.45);
assert.equal(common.ORM.settings.get("some.other.sub.object", 789), 789);

var testFunction = function () {
	return "test";
};

common.ORM.settings.set("some....object", testFunction);

assert.equal(common.ORM.settings.get("some....object"), testFunction);

common.ORM.settings.unset("some....object", "some.sub.object");

assert.equal(common.ORM.settings.get("some....object"), undefined);
assert.equal(common.ORM.settings.get("some.sub.object"), undefined);
