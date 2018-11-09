const base_url = process.env.FRONTEND_URL || 'http://localhost:3100/';
const teacher_name = process.env.TEACHER_NAME || 'lehrer@schul-cloud.org';
const password = process.env.PASSWORD || "schulcloud";
const short_title = (process.env.SC_SHORT_TITLE || "Schul-Cloud").trim();

module.exports = {
    'Schul-Cloud Reachable': function (browser) {
        browser
            .url(base_url + 'login/')
            .waitForElementVisible('body', 1000);
    },
    'Schul-Cloud Visibility': function (browser) {
        browser.expect.element('input[name=username]').to.be.visible;
        browser.expect.element('input[name=password]').to.be.visible;
    },
    'Schul-Cloud Login': function (browser) {
        browser
            .setValue('input[name=username]', teacher_name)
            .setValue('input[name=password]', password)
            .waitForElementVisible('input[type=submit]', 1000)
            .click('input[type=submit]')
            .pause(1000);
    },
    'Schul-Cloud Checkups': function (browser) {
        browser.setCookie({
            name: "releaseDate",
            value: "9999-12-09T16:36:20.000Z",
            path: "/"
        });
    },
    'Create Homework': function (browser) {
        browser.url(base_url + 'homework/new/');
        browser.expect.element('h4').text.to.contain('Aufgabe hinzufügen').before(10000);
        browser
            .setValue('input[name=name]', 'Test Aufgabe')
            .useXpath().moveToElement('//*[@id="homework-form"]/div[7]/button[2]', 10, 10);
        browser.useXpath().click('//*[@id="homework-form"]/div[7]/button[2]');
        browser.useCss().waitForElementPresent("#titlebar h4", 10000);
        browser.assert.containsText("#titlebar h4", "Aufgaben");
        browser.assert.title(`Aufgaben - ${short_title}`);
    },
    'Delete Homework': function (browser) {
        browser.useXpath().click("//*[contains(text(), 'Test Aufgabe')]");
        browser.useCss()
          .click('#extended > div.homework > a.btn.btn-secondary.btn-delete')
          .waitForElementVisible('.delete-modal');
        browser.useXpath()
          .waitForElementVisible('/html/body/div[7]/div/div/div[2]/button[2]', 1000)
          .click('/html/body/div[7]/div/div/div[2]/button[2]')
          .pause(1000);
    },
    'Schul-Cloud End': function (browser) {
        browser.end();
    }
};
