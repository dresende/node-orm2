var common     = require('../common');
var assert     = require('assert');
var Property   = require('../../lib/Property');

assert.equal(Property.check(String).type, "text");
assert.equal(Property.check(Number).type, "number");
assert.equal(Property.check(Boolean).type, "boolean");
assert.equal(Property.check(Date).type, "date");

assert.equal({ type: "text" }.type, "text");
assert.equal({ type: "number" }.type, "number");
assert.equal({ type: "boolean" }.type, "boolean");
assert.equal({ type: "date" }.type, "date");

assert.throws(function () {
	Property.check({ type: "unknown" });
});
