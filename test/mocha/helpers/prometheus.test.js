const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../../app');

const { expect } = chai;
const loginHelper = require('../helper/login-helper');

chai.use(chaiHttp);

describe('with prometheus metrics enabled', () => {
	before((done) => {
		this.server = app.listen(3100);
		this.server.once('listening', () => {
			loginHelper.login(app).then((res) => {
				this.agent = res.agent;
				done();
			});
		});
	});

	after((done) => {
		this.server.close(done);
	});

	it('should have /metrics route available', async () => {
		const response = await this.agent.get('/metrics');
		expect(response.status).to.equal(200);
		expect(response.text).to.contain('http_request_duration_seconds');
	});
	it("should add path's and replace id's in path", async () => {
		// request an url having an id within their path
		const id = '09876a54321234f567800024'; // object id like
		await this.agent.get(`/schools/${id}`);

		const metricsResponse = await this.agent.get('/metrics');
		expect(metricsResponse.text, 'contains login in path as we have logged in before').to.contain('"/login"');
		expect(metricsResponse.text, 'contains schools in path').to.contain('/schools');
		expect(metricsResponse.text, "contains uuid's in path replaced by __id__").to.contain('__id__');
		expect(metricsResponse.text, 'not contains id').to.not.contain(String(id));
	});
	it("should rewrite path's from static ressources", async () => {
		const path = '/fonts/ressource.txt';
		await this.agent.get(path);

		const metricsResponse = await this.agent.get('/metrics');
		expect(metricsResponse.text, 'does not contain the requested path').to.not.contain(path);
		expect(metricsResponse.text, 'but contains a replacement path').to.contain('/any_static_ressource');
	});
	it('should contains nodejs and process metrics', async () => {
		// requires to be executed in order
		const response = await this.agent.get('/metrics');
		expect(response.text, 'has eventloop information').to.contain('nodejs_eventloop_lag_seconds');
		expect(response.text, 'has node js version info').to.contain('nodejs_version_info');
	});
});
