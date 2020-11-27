const chai = require('chai');
const sinon = require('sinon');
const { i18next } = require('../../../helpers/i18n');

const { expect } = chai;

const api = require('../../../api');

const authHelper = require('../../../helpers/authentication');
const { mainRoute } = require('../../../controllers/account/accountLogic');

describe('acccount controller tests', () => {
	let req;
	let res;
	let apiInstance;
	let apiMock;
	let authHelperMock;

	beforeEach(() => {
		apiInstance = api(req);
		apiMock = sinon.mock(apiInstance);
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
			$t(translationKey) {
				return i18next.t(translationKey);
			},
		};
	});

	it('should render account/settings template for route / if  api calls fail', async () => {
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

		function TestError() {
			this.error = {
				message: 'Test error message',
			};
		}
		apiMock.expects('patch').once().withArgs('/accounts/1231234').once()
			.resolves();
		apiMock.expects('patch').once().withArgs('/users/123').once()
			.throws(new TestError());
		authHelperMock.expects('populateCurrentUser').never();

		// when
		await mainRoute(req, res, apiInstance);

		// then
		apiMock.restore();
		apiMock.verify();
		authHelperMock.restore();
		authHelperMock.verify();
		const expectedTemplateToRender = 'account/settings';
		const expectedTitle = i18next.t('account.headline.yourAccount');
		expect(res.templateName).to.equal(expectedTemplateToRender);
		expect(res.props.title).to.equal(expectedTitle);
		expect(res.props.notification.type).to.equal('danger');
		expect(res.props.notification.message).to.equal('Test error message');
	});
});
