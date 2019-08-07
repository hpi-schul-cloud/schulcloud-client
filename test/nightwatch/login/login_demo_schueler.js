const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3100/';

module.exports = {
	'Schul-Cloud Reachable': function reachable(browser) {
		browser.url(`${baseUrl}login/`).waitForElementVisible('body', 1000);
	},
	'Schul-Cloud Visibility': function visibility(browser) {
		/* eslint-disable no-unused-expressions */
		browser.expect.element('input[name=username]').to.be.visible;
		browser.expect.element('input[name=password]').to.be.visible;
		/* eslint-enable no-unused-expressions */
	},
	'Schul-Cloud Login': function login(browser) {
		browser
			.setValue('input[name=username]', 'demo-schueler@schul-cloud.org')
			.setValue('input[name=password]', 'schulcloud')
			.waitForElementVisible('input[type=submit]', 1000)
			.click('input[type=submit]')
			.pause(1000);
	},
	'Schul-Cloud Checkups': function checkup(browser) {
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Übersicht')
			.before(10000);
		browser.expect
			.element('#main-content > section.section-timetable > div.row > div > h2')
			.text.to.contain('Stundenplan')
			.before(10000);
		browser.setCookie({
			name: 'releaseDate',
			value: '9999-12-09T16:36:20.000Z',
			path: '/',
		});
	},
	'Schul-Cloud Visit Every Subpage': function visitSubpage(browser) {
		// News
		browser.url(`${baseUrl}news/`);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Neuigkeiten')
			.before(10000);

		// Courses
		browser.url(`${baseUrl}courses/`);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Meine Kurse')
			.before(10000);

		// Calendar
		browser.url(`${baseUrl}calendar/`);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Kalender')
			.before(10000);

		// Homework
		browser.url(`${baseUrl}homework/`);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Aufgaben')
			.before(10000);

		// browser.url(baseUrl + 'homework/asked/');
		// browser.expect.element('#titlebar h4#page-title').text.to.contain('Gestellte Aufgaben').before(10000);

		// browser.url(baseUrl + 'homework/private/');
		// browser.expect.element('#titlebar h4#page-title').text.to.contain('Meine Aufgaben').before(10000);

		// browser.url(baseUrl + 'homework/archive/');
		// browser.expect.element('#titlebar h4#page-title').text
		//      .to.contain('Archivierte Aufgaben und ToDos').before(10000);

		// Files
		browser.url(`${baseUrl}files/`);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Meine Dateien')
			.before(10000);

		browser.url(`${baseUrl}files/my/`);
		browser.waitForElementVisible('#titlebar h1#page-title', 10000);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Dateien')
			.before(10000);

		browser.url(`${baseUrl}files/courses/`);
		browser.waitForElementVisible('#titlebar h1#page-title', 10000);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Dateien')
			.before(10000);

		browser.url(`${baseUrl}files/shared/`);
		browser.waitForElementVisible('#titlebar h1#page-title', 10000);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Dateien')
			.before(10000);

		// Content
		browser.url(`${baseUrl}content/`);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Lern-Store')
			.before(10000);

		// Settings
		browser.url(`${baseUrl}account/`);
		browser.expect
			.element('#titlebar h1#page-title')
			.text.to.contain('Dein Account')
			.before(10000);
	},
	'Schul-Cloud End': function end(browser) {
		browser.end();
	},
};
