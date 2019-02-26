'use strict';

const assert = require('assert');
const app = require('../../../app');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('Link tests', function () {
    this.timeout(10000);
    before(function (done) {
        this.server = app.listen(3031);
        this.server.once('listening', () => {
            done();
        });
    });

    after(function (done) {
        this.server.close(done);
    });

    it('GET /link/:id', function () {
        let testId = "sc42";
        return new Promise((resolve, reject) => {
            chai.request(app)
                .get('/link/' + testId)
                .end((err, res) => {
                    let hasLink = false
                    // NOTE It is unclear why res.redirects is an array. However, to make the test agnostic, we loop through all 
                    let baseUrl = process.env.BACKEND_URL || 'http://localhost:3030';
                    res.redirects.forEach(redirectString => {
                        if (redirectString.includes(`${baseUrl}/link/${testId}`)) hasLink = true
                    });

                    expect(hasLink).to.be.true;
                    resolve();
                });
        });
    });
});
