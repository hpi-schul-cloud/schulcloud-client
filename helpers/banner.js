const { Configuration } = require('@hpi-schul-cloud/commons');

const SC_THEME = Configuration.get('SC_THEME');

const getTeamsInfoBannerTranslateKey = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'administration.teams.text.bannerHelp_n21';
		case 'thr':
			return 'administration.teams.text.bannerHelp_thr';
		case 'brb':
			return 'administration.teams.text.bannerHelp_brb';
		default:
			return 'administration.teams.text.bannerHelp_dbc';
	}
};

module.exports = getTeamsInfoBannerTranslateKey;
