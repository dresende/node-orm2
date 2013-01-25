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

common.ORM.settings.set("some.other.stuff", 123.45);
common.ORM.settings.set("some.more.stuff", 123.45);
common.ORM.settings.unset("some.*");

assert.equal(common.ORM.settings.get("some.other.stuff"), undefined);
assert.equal(common.ORM.settings.get("some.more.stuff"), undefined);
assert.equal(typeof common.ORM.settings.get("some.*"), "object");
assert.equal(Object.keys(common.ORM.settings.get("some.*")).length, 0);
assert.equal(typeof common.ORM.settings.get("some"), "object");
assert.equal(Object.keys(common.ORM.settings.get("some")).length, 0);
