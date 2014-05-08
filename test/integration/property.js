var should   = require('should');
var ORM      = require("../..");
var Property = ORM.Property;

describe("Property", function () {
	it("passing String should return type: 'text'", function (done) {
		Property.normalize(
			{ prop: String, customTypes: {}, settings: ORM.settings, name: 'abc' }
		).type.should.equal("text");

		return done();
	});
	it("passing Number should return type: 'number'", function (done) {
		Property.normalize(
			{ prop: Number, customTypes: {}, settings: ORM.settings, name: 'abc' }
		).type.should.equal("number");

		return done();
	});
	it("passing deprecated rational: false number should return type: 'integer'", function (done) {
		Property.normalize(
			{ prop: {type: 'number', rational: false}, customTypes: {}, settings: ORM.settings, name: 'abc'}
		).type.should.equal("integer");

		return done();
	});

	it("passing Boolean should return type: 'boolean'", function (done) {
		Property.normalize(
			{ prop: Boolean, customTypes: {}, settings: ORM.settings, name: 'abc' }
		).type.should.equal("boolean");

		return done();
	});
	it("passing Date should return type: 'date'", function (done) {
		Property.normalize(
			{ prop: Date, customTypes: {}, settings: ORM.settings, name: 'abc' }
		).type.should.equal("date");

		return done();
	});
	it("passing Object should return type: 'object'", function (done) {
		Property.normalize(
			{ prop: Object, customTypes: {}, settings: ORM.settings, name: 'abc' }
		).type.should.equal("object");

		return done();
	});
	it("passing Buffer should return type: 'binary'", function (done) {
		Property.normalize(
			{ prop: Buffer, customTypes: {}, settings: ORM.settings, name: 'abc' }
		).type.should.equal("binary");

		return done();
	});
	it("passing an Array of items should return type: 'enum' with list of items", function (done) {
		var prop = Property.normalize(
			{ prop: [1, 2, 3], customTypes: {}, settings: ORM.settings, name: 'abc' }
		)

		prop.type.should.equal("enum");
		prop.values.should.have.property("length", 3);

		return done();
	});
	describe("passing a string type", function () {
		it("should return type: <type>", function (done) {
			Property.normalize(
				{ prop: "text", customTypes: {}, settings: ORM.settings, name: 'abc' }
			).type.should.equal("text");

			return done();
		});
    it("should accept: 'point'", function (done) {
      Property.normalize(
				{ prop: "point", customTypes: {}, settings: ORM.settings, name: 'abc' }
			).type.should.equal("point");

      return done();
    });

		describe("if not valid", function () {
			it("should throw", function (done) {
				(function () {
					Property.normalize(
						{ prop: "string", customTypes: {}, settings: ORM.settings, name: 'abc' }
					)
				}).should.throw();

				return done();
			});
		});
	});
	it("should not modify the original property object", function (done) {
		var original = { type: 'text', required: true };

		var normalized = Property.normalize(
			{ prop: original, customTypes: {}, settings: ORM.settings, name: 'abc' }
		);

		original.test = 3;
		should.strictEqual(normalized.test, undefined);

		return done();
	});
});
