const chai = require('chai');
const sinon = require('sinon');

const { i18next } = require('../../../helpers/i18n');

const { expect } = chai;

const api = require('../../../api');

const authHelper = require('../../../helpers/authentication');

const requestPromise = {
	patch() {},
};

const apiStub = sinon.stub(api, 'api').returns(requestPromise);
const { mainRoute } = require('../../../controllers/account/accountLogic');


describe('acccount controller tests', () => {
	let req;
	let res;
	let authHelperMock;
	let requestPromiseStub;
	function TestError() {
		this.error = {
			message: 'Test error message',
		};
	}
	beforeEach(() => {
		requestPromiseStub = sinon.stub(requestPromise, 'patch');
		authHelperMock = sinon.mock(authHelper);
		req = {
			body: {
				firstName: 'Test name',
				lastName: 'Test lastname',
				email: 'Test email',
				password: 'Test password',
				passwordNew: 'Test new password',
				language: 'Test language',
			},
		};
		res = {
			render(templateName, props) {
				this.templateName = templateName;
				this.props = props;
			},
			redirect(route) {
				this.route = route;
			},
			$t(translationKey) {
				return i18next.t(translationKey);
			},
		};
	});

	afterEach(() => {
		requestPromiseStub.restore();
	});

	it('should render account/settings template if api call fails', async () => {
		// given
		const locals = {
			currentPayload: {
				accountId: 1231234,
			},
			currentUser: {
				_id: 123,
			},
		};
		res.locals = locals;
		requestPromiseStub.rejects(new TestError());

		// when
		await mainRoute(req, res);

		// then
		const expectedTemplate = 'account/settings';
		expect(res.templateName).to.equal(expectedTemplate);
	});

	it('should pass notification: danger and error message to the template when api call fails', async () => {
		// given
		const locals = {
			currentPayload: {
				accountId: 1231234,
			},
			currentUser: {
				_id: 123,
			},
		};
		res.locals = locals;
		const testError = new TestError();
		requestPromiseStub.rejects(testError);

		// when
		await mainRoute(req, res);

		// then
		expect(res.props.notification.type).to.equal('danger');
		expect(res.props.notification.message).to.equal(testError.error.message);
	});

	it('should not call populateCurrentUser if api call fails', async () => {
		// given
		const locals = {
			currentPayload: {
				accountId: 1231234,
			},
			currentUser: {
				_id: 123,
			},
		};
		res.locals = locals;
		requestPromiseStub.rejects(new TestError());
		authHelperMock.expects('populateCurrentUser').never();

		// when
		await mainRoute(req, res);

		// then
		authHelperMock.verify();
		authHelperMock.restore();
	});

	it('should redirect to /account/ route if api calls passes', async () => {
		// given
		const locals = {
			currentPayload: {
				accountId: 1231234,
			},
			currentUser: {
				_id: 123,
			},
		};
		res.locals = locals;

		requestPromiseStub.resolves();

		// when
		await mainRoute(req, res);

		// then
		expect(res.route).to.equal('/account/');
	});

	it('should call populateCurrentUser if api calls passes', async () => {
		// given
		const locals = {
			currentPayload: {
				accountId: 1231234,
			},
			currentUser: {
				_id: 123,
			},
		};
		res.locals = locals;

		requestPromiseStub.resolves();
		authHelperMock.expects('populateCurrentUser').once();

		// when
		await mainRoute(req, res);

		// then
		authHelperMock.verify();
	});
});
