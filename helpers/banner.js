const { Configuration } = require('@hpi-schul-cloud/commons');

const SC_THEME = Configuration.get('SC_THEME');

const getTeamsInfoBannerTranslateKey = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'teams.text.item2_n21';
		case 'thr':
			return 'teams.text.item2_thr';
		case 'brb':
			return 'teams.text.item2_brb';
		default:
			return 'teams.text.item2_dbc';
	}
};

module.exports = getTeamsInfoBannerTranslateKey;
