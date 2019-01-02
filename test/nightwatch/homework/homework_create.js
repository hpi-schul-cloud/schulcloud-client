const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3100/';
const teacherName = process.env.TEACHER_NAME || 'lehrer@schul-cloud.org';
const password = process.env.PASSWORD || 'schulcloud';
const shortTitle = (process.env.SC_SHORT_TITLE || 'Schul-Cloud').trim();

module.exports = {
	'Schul-Cloud Reachable': function (browser) {
		browser
			.url(baseUrl + 'login/')
			.waitForElementVisible('body', 1000);
	},
	'Schul-Cloud Visibility': function (browser) {
		browser.expect.element('input[name=username]').to.be.visible;
		browser.expect.element('input[name=password]').to.be.visible;
	},
	'Schul-Cloud Login': function (browser) {
		browser
			.setValue('input[name=username]', teacherName)
			.setValue('input[name=password]', password)
			.waitForElementVisible('input[type=submit]', 1000)
			.click('input[type=submit]')
			.pause(1000);
	},
	'Schul-Cloud Checkups': function (browser) {
		browser.setCookie({
			name: 'releaseDate',
			value: '9999-12-09T16:36:20.000Z',
			path: '/'
		});
	},
	'Create Homework': function (browser) {
		browser.url(baseUrl + 'homework/new/');
		browser.expect.element('h4').text.to.contain('Aufgabe hinzufügen').before(10000);
		browser
			.setValue('input[name=name]', 'Test Aufgabe')
			.useXpath().moveToElement('//*[@id="homework-form"]/div[7]/button[2]', 10, 10);
		browser.useXpath().click('//*[@id="homework-form"]/div[7]/button[2]');
		browser.useCss().waitForElementPresent('#titlebar h4', 10000);
		browser.assert.containsText('#titlebar h4', 'Aufgaben');
		browser.assert.title(`Aufgaben - ${shortTitle}`);
	},
	'Delete Homework': function (browser) {
		browser.useXpath().click("//*[contains(text(), 'Test Aufgabe')]");
		browser.useCss()
			.click('#extended > div.homework > a.btn.btn-secondary.btn-delete')
			.waitForElementVisible('.delete-modal .modal-footer button.btn.btn-submit', 1000)
			.click('.delete-modal .modal-footer button.btn.btn-submit')
			.pause(1000);
		browser.assert.title(`Aufgaben - ${shortTitle}`);
	},
	'Schul-Cloud End': function (browser) {
		browser.end();
	}
};
