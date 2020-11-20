/**
 * Express is loosing the control flow for error handling of async middleware functions.
 * All async middlewares need to be wrapped with this method to ensure error handling works as expected.
 * @param {*} middlewareFunction async (req, res, next)
 */
module.exports = (middlewareFunction) => function asyncWrapper(...args) {
	const fnReturn = middlewareFunction(...args);
	const next = args[args.length - 1];
	return Promise.resolve(fnReturn).catch(next);
};
