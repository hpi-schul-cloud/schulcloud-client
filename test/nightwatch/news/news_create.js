const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3100/';
const teacherName = process.env.TEACHER_NAME || 'lehrer@schul-cloud.org';
const password = process.env.PASSWORD || 'Schulcloud1!';

module.exports = {
	'Schul-Cloud Reachable': function reachable(browser) {
		browser.url(`${baseUrl}login/`).waitForElementVisible('body', 1000);
	},
	'Schul-Cloud Visibility': function visibility(browser) {
		/* eslint-disable no-unused-expressions */
		/* jshint ignore:start */
		browser.expect.element('input[name=username]').to.be.visible;
		browser.expect.element('input[name=password]').to.be.visible;
		/* jshint ignore:end */
		/* eslint-enable no-unused-expressions */
	},
	'Schul-Cloud Login': function login(browser) {
		browser
			.setValue('input[name=username]', teacherName)
			.setValue('input[name=password]', password)
			.waitForElementVisible('input[type=submit]', 1000)
			.click('input[type=submit]')
			.pause(1000);
	},
	'Schul-Cloud Checkups': function checkup(browser) {
		browser.setCookie({
			name: 'releaseDate',
			value: '9999-12-09T16:36:20.000Z',
			path: '/',
		});
	},
	'Create News': function createNews(browser) {
		browser.url(`${baseUrl}news/`);
		browser.expect
			.element('h1')
			.text.to.contain('Neuigkeiten')
			.before(10000);
		/* eslint-disable */
		/* For some reason CKeditor won't work if its fixed by eslint therefor I have disabled it for this line*/
		browser
			.click('.create')
			.pause(1000)
			.setValue('input[name=title]', 'Test News')
			.execute(function() {
				CKEDITOR.instances['content'].setData('Lorem Ipsum'); // jshint ignore:line
			})
			.moveToElement('.btn-submit', 10, 10)
			.click('.btn-submit')
			.pause(1000);
		/* eslint-enable */
		browser
			.useXpath()
			.expect.element("//*[contains(text(), 'Lorem Ipsum')]")
			.text.to.contain('Lorem Ipsum')
			.before(10000);
	},
	'Delete News': function deleteNews(browser) {
		browser.useXpath().click("//*[contains(text(), 'Test News')]");
		browser
			.useCss()
			.click('.btn-delete')
			.waitForElementVisible('.delete-modal')
			.waitForElementVisible('.delete-modal .btn-submit', 1000)
			.click('.delete-modal .btn-submit')
			.pause(1000);
	},
	'Schul-Cloud End': function end(browser) {
		browser.end();
	},
};
