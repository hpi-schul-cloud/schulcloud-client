/*
 * One Controller per layout view
 */

const express = require('express');
const api = require('../../api');
const authHelper = require('../../helpers/authentication');

const router = express.Router();

router.use(authHelper.authChecker);

const getMockDatasource = async title => ({
	_id: `provider${title}`,
	createdAt: new Date(),
	createdBy: { displayName: 'Cord Carl' },
	updatedAt: new Date(),
	updatedBy: { displayName: 'Cord Carl' },
	lastRun: new Date(),
	lastStatus: ['Success', 'Warning', 'Error'][Math.floor(Math.random() * 3)],
	config: {
		type: title || 'WebUntis',
		// ... (provider specific credentials)
		schoolname: 'schoolname',
		username: 'username',
		password: 'password',
		endpoint: 'endpoint',
	},
});

const getMockRun = async title => ({
	_id: `run${title}`,
	datasource: `123${title}`,
	createdAt: new Date(),
	createdBy: { displayName: 'Cord Carl' },
	duration: Math.round(Math.random() * 1000),
	status: ['Success', 'Warning', 'Error'][Math.floor(Math.random() * 3)],
	dryRun: !!Math.round(Math.random()),
	logUrl: 'https://some.log',
	config: (await getMockDatasource(title)).config,
});

router.get('/webuntis/edit', (req, res, next) => {
	res.render('administration/datasources/webuntis-edit', {
		title: 'WebUntis bearbeiten',
		action: '/administration/datasources/webuntis/edit',
	});
});
router.post('/webuntis/edit', (req, res, next) => {
	if (!req.body.endpoint) {
		req.body.endpoint = 'erato.webuntis.com';
	}
	console.log('BODY:', req.body);
	res.redirect('/administration/datasources/webuntis');
});


router.post('/:id', (req, res, next) => {
	console.log('BODY:', req.body);
	res.redirect('/administration/datasources/:id');
});

router.get('/:id', async (req, res, next) => {
	const datasourceProvider = await getMockDatasource('WebUntis');
	res.render('administration/datasources/providerDetails', {
		title: datasourceProvider.config.type,
		breadcrumb: [
			{
				title: 'Datenquellen',
				url: '/administration/datasources',
			},
		],
		formName: `administration/datasources/forms/form-${datasourceProvider.config.type}`,
		datasourceProvider,
		runs: [
			await getMockRun(datasourceProvider.config.type),
			await getMockRun(datasourceProvider.config.type),
			await getMockRun(datasourceProvider.config.type),
			await getMockRun(datasourceProvider.config.type),
		],
		hasLoginData: !!(new Date().getSeconds() % 2),
	});
});
router.get('/', async (req, res, next) => {
	res.render('administration/datasources/overview', {
		title: 'Datenquellen',
		datasources: [
			await getMockDatasource('WebUntis'),
			await getMockDatasource('Random Resource'),
		],
	});
});


module.exports = router;
