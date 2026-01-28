const { SC_THEME } = require('../config/global');

const translateKeyInfoBanner = () => {
	switch (SC_THEME) {
		case 'n21':
			return 'teams.banner.item1_n21';
		case 'thr':
			return 'teams.banner.item1_thr';
		case 'brb':
			return 'teams.banner.item1_brb';
		default:
			return 'teams.banner.item1_dbc';
	}
};

module.exports = translateKeyInfoBanner;
