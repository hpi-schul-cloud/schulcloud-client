/*
 * One Controller per layout view
 */

const express = require('express');
const api = require('../../../api');
const authHelper = require('../../../helpers/authentication');

const router = express.Router();

router.use(authHelper.authChecker);

router.use('/webuntis/', require('./webuntis'));


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
		endpoint: 'https://endpoint.url',
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


router.post('/:id', (req, res, next) => {
	console.log('NEW CONFIG:\n', req.body);
	/* TODO
	 * - save new config (from req.body)
	 * - start new import
	 * - redirect to import user-input page (type specific)
	 */
	res.redirect('/administration/datasources/webuntis/run/runId');
});

router.get('/run/:id', (req, res, next) => {
	/* TODO
	 * - start new import with currently saved config
	 * - redirect to import user-input page (type specific)
	 */
	res.redirect('/administration/datasources/webuntis/run/runId');
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
		formName: `administration/datasources/${datasourceProvider.config.type}/form-settings`,
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
