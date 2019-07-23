const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3100/';
const teacherName = process.env.TEACHER_NAME || 'lehrer@schul-cloud.org';
const password = process.env.PASSWORD || 'Schulcloud1!';

module.exports = {
	'Schul-Cloud Reachable': function reachable(browser) {
		browser.url(`${baseUrl}login/`).waitForElementVisible('body', 1000);
	},
	'Schul-Cloud Visibility': function visbility(browser) {
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
	'Create Homework': function createHomework(browser) {
		browser.url(`${baseUrl}homework/new/`);
		browser.expect
			.element('h1')
			.text.to.contain('Aufgabe hinzufügen')
			.before(10000);
		browser
			.setValue('input[name=name]', 'Test Aufgabe')
			.useXpath()
			.moveToElement('//*[@id="homework-form"]/div[7]/button[2]', 10, 10);
		browser.useXpath().click('//*[@id="homework-form"]/div[7]/button[2]');
		browser.useCss().waitForElementPresent('#titlebar h1', 10000);
		browser.assert.containsText('#titlebar h1', 'Aufgaben');
		browser.getTitle((title) => {
			browser.assert.ok(title.includes('Aufgaben'));
		});
	},
	'Delete Homework': function deleteHomework(browser) {
		browser.useXpath().click("//*[contains(text(), 'Test Aufgabe')]");
		browser
			.useCss()
			.click('#extended > div.homework > a.btn.btn-secondary.btn-delete')
			.waitForElementVisible('.delete-modal')
			.waitForElementVisible('body > .modal.delete-modal.in button.btn-submit', 1000)
			.moveToElement('body > div.modal.delete-modal.in div.modal-footer button.btn-submit', 10, 10)
			.mouseButtonClick(0)
			.pause(1000);
	},
	'Schul-Cloud End': function end(browser) {
		browser.end();
	},
};
