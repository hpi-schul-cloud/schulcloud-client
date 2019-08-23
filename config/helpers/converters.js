module.exports = {
	boolean(value) {
		if (value === 'true' || value === true) {
			return true;
		}
		if (value === false || value === 'false') {
			return false;
		}
		throw new Error();
	},
};
