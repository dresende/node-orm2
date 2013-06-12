var common     = require('../common');
var assert     = require('assert');
var Validation = require('../../lib/Validators');
var _; // undefined

Validation.rangeNumber(0, 10)(5, checkValidation());
Validation.rangeNumber(_, 10)(-5, checkValidation());
Validation.rangeNumber(-10, _)(-5, checkValidation());
Validation.rangeNumber(0, 10)(-5, checkValidation('out-of-range-number'));
Validation.rangeNumber(_, 10)(15, checkValidation('out-of-range-number'));
Validation.rangeNumber(0, _)(-5, checkValidation('out-of-range-number'));
Validation.rangeNumber(0, _, 'custom-error')(-5, checkValidation('custom-error'));

Validation.rangeLength(0, 10)('test', checkValidation());
Validation.rangeLength(_, 10)('test', checkValidation());
Validation.rangeLength(0, _)('test', checkValidation());
Validation.rangeLength(4, _)('test', checkValidation());
Validation.rangeLength(0, _)(_, checkValidation('undefined'));
Validation.rangeLength(0, 3)('test', checkValidation('out-of-range-length'));
Validation.rangeLength(5, _)('test', checkValidation('out-of-range-length'));
Validation.rangeLength(_, 3)('test', checkValidation('out-of-range-length'));
Validation.rangeLength(_, 3, 'custom-error')('test', checkValidation('custom-error'));

Validation.insideList([ 1, 2, 3 ])(1, checkValidation());
Validation.insideList([ 1, 2, 3 ])(3, checkValidation());
Validation.insideList([ 1, 2, 3 ])(4, checkValidation('outside-list'));
Validation.insideList([ 1, 2, 3 ])('1', checkValidation('outside-list'));
Validation.insideList([ 1, 2, 3 ])('', checkValidation('outside-list'));
Validation.insideList([ 1, 2, 3 ])([], checkValidation('outside-list'));
Validation.insideList([ 1, 2, 3 ], 'custom-error')([], checkValidation('custom-error'));

Validation.outsideList([ 1, 2, 3 ])(4, checkValidation());
Validation.outsideList([ 1, 2, 3 ])(-2, checkValidation());
Validation.outsideList([ 1, 2, 3 ])('', checkValidation());
Validation.outsideList([ 0, 2, 3 ])(null, checkValidation());
Validation.outsideList([ 1, 2, 3 ])('2', checkValidation());
Validation.outsideList([ 1, 2, 3 ])(2, checkValidation('inside-list'));
Validation.outsideList([ 1, 2, 3 ], 'custom-error')(2, checkValidation('custom-error'));

Validation.notEmptyString()('a', checkValidation());
Validation.notEmptyString()('', checkValidation('empty-string'));
Validation.notEmptyString('custom-error')('', checkValidation('custom-error'));
Validation.notEmptyString()(_, checkValidation('undefined'));
Validation.notEmptyString('custom-error')(_, checkValidation('undefined'));

function checkValidation(ret1) {
	return function (ret2) {
		assert.strictEqual(ret1, ret2);
	};
}
