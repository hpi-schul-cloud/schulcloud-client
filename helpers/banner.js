const { SC_THEME } = require('../config/global');

const translateKeyTeamsInfoBanner = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'teams.text.item1_n21';
		case 'thr':
			return 'teams.text.item1_thr';
		case 'brb':
			return 'teams.text.item1_brb';
		default:
			return 'teams.text.item1_dbc';
	}
};

module.exports = translateKeyTeamsInfoBanner;
