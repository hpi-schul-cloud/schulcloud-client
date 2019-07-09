// jshint esversion: 6
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3100/';
const teacherName = process.env.TEACHER_NAME || 'lehrer@schul-cloud.org';
const password = process.env.PASSWORD || 'Schulcloud1!';

module.exports = {
	'Schul-Cloud Reachable': function reachableTest(browser) {
		browser

			.url(`${baseUrl}login/`)
			.waitForElementVisible('body', 1000);
	},
	'Schul-Cloud Visibility': function visibilityTest(browser) {
		// eslint-disable-next-line no-unused-expressions
		browser.expect.element('input[name=username]').to.be.visible;
		// eslint-disable-next-line no-unused-expressions
		browser.expect.element('input[name=password]').to.be.visible;
	},
	'Schul-Cloud Login': function loginTest(browser) {
		browser
			.setValue('input[name=username]', teacherName)
			.setValue('input[name=password]', password)
			.waitForElementVisible('input[type=submit]', 1000)
			.click('input[type=submit]')
			.pause(1000);
	},
	'Schul-Cloud Checkups': function checkupsTest(browser) {
		browser.setCookie({
			name: 'releaseDate',
			value: '9999-12-09T16:36:20.000Z',
			path: '/',
		});
	},
	'Create Course': function createCourseTest(browser) {
		browser.url(`${baseUrl}courses/`);
		browser.expect.element('h1').text.to.contain('Meine Kurse').before(10000);
		browser.useXpath().moveToElement('//*[@id="main-content"]/section/div/div/div/div', 10, 10)
			.useCss()
			.click('.btn-add')
			.pause(1000)
			.setValue('input[name=name]', 'Test Kurs')
			.setValue('input[name=startDate]', '01.01.2019')
			.setValue('input[name=untilDate]', '01.03.2019')
			.moveToElement('#nextSection', 10, 10)
			.click('#nextSection')
			.pause(1000)
			.moveToElement('#nextSection', 10, 10)
			.click('#nextSection');

		browser
			.useCss()
			.waitForElementVisible('.btn-primary', 10000)
			.click('.btn-primary')
			.pause(1000);
		browser.useXpath().expect.element("//*[contains(text(), 'Test Kurs')]")
			.text.to.contain('Test Kurs').before(10000);
	},
	'Delete Course': function deleteCourseTest(browser) {
		browser.useXpath().expect.element("//*[contains(text(), 'Test Kurs')]")
			.text.to.contain('Test Kurs').before(10000);
		browser.useXpath().click("//*[contains(text(), 'Test Kurs')]");
		browser.useCss().expect.element('#main-content > div.dropdown-course > a > h1')
			.text.to.contain('Test Kurs').before(10000);
		browser.useCss()
			.waitForElementVisible('.btn-course-dropdown', 1000)
			.click('.btn-course-dropdown')
			.waitForElementVisible('.btn-course-edit', 1000)
			.click('.btn-course-edit')
			.waitForElementVisible('.btn-delete-course', 1000)
			.click('.btn-delete-course')
			.waitForElementVisible('.delete-modal', 1000)
			.waitForElementVisible('.delete-modal.in .btn-submit', 1000)
			.click('.delete-modal.in .btn-submit')
			.pause(1000);
	},
	'Schul-Cloud End': function endTest(browser) {
		browser.end();
	},
};
