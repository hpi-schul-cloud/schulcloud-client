const validators = require('./validators');
const converters = require('./converters');

/**
 * Validates and converts values
 * @param {*} value
 * @param {*} validation validation rule name or array of validation rules
 * @param {*} converter converter to be applied upon sucessful validation on return value
 */
const parse = (value, validation, converter) => {
	const validate = (validator, v) => {
		if (!validators[validator]) {
			throw new Error(`error validating config value '${v}'. Validator '${validator}' was not found.`);
		}
		if (validators[validator] instanceof RegExp) {
			return validators.regExp(value, validator);
		}
		if (validators[validator](v) !== true) {
			throw new Error(`error validating config value '${v}'. Validation failed using validator '${validator}'.`);
		}
		return true;
	};

	if (Array.isArray(validation)) {
		validation.forEach((validator) => {
			validate(validator, value);
		});
	} else {
		validate(validation, value);
	}

	if (!converter) {
		try {
			// try just setting value
			return value;
		} catch (error) {
			throw new Error(`error setting config value '${value}'`);
		}
	} else {
		try {
			// try setting value after conversion
			return converters[converter](value);
		} catch (error) {
			throw new Error(`error setting config value '${value}' using converter '${converter}'`, error);
		}
	}
};

module.exports = { parse };
