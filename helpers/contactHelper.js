const getSortedHelpOtions = (res) => {
	const helpOptions = [
		{
			optionValue: 'Aufgaben',
			optionText: res.$t('help.chooseTopicArea.text.pTasks'),
		},
		{
			optionValue: 'Authentifizierung',
			optionText: res.$t('help.chooseTopicArea.text.pAuthentication'),
		},
		{
			optionValue: 'Bereiche',
			optionText: res.$t('help.chooseTopicArea.text.pBoards'),
		},
		{
			optionValue: 'Dateien',
			optionText: res.$t('help.chooseTopicArea.text.pMyFiles'),
		},
		{
			optionValue: 'Datenschutz',
			optionText: res.$t('help.chooseTopicArea.text.pPrivacy'),
		},
		{
			optionValue: 'Externe Tools',
			optionText: res.$t('help.chooseTopicArea.text.pExternalTools'),
		},
		{
			optionValue: 'Hilfebereich',
			optionText: res.$t('help.chooseTopicArea.text.pHelparea'),
		},
		{
			optionValue: 'Kommunikation',
			optionText: res.$t('help.chooseTopicArea.text.pCommunication'),
		},
		{
			optionValue: 'Kurse',
			optionText: res.$t('help.chooseTopicArea.text.pCourses'),
		},
		{
			optionValue: 'Mobile Nutzung',
			optionText: res.$t('help.chooseTopicArea.text.pMobileUse'),
		},
		{
			optionValue: 'Neuigkeiten',
			optionText: res.$t('help.chooseTopicArea.text.pNews'),
		},
		{
			optionValue: 'Raueme',
			optionText: res.$t('help.chooseTopicArea.text.pRooms'),
		},
		{
			optionValue: 'Sonstige',
			optionText: res.$t('help.chooseTopicArea.text.pOther'),
		},
		{
			optionValue: 'Teams',
			optionText: res.$t('help.chooseTopicArea.text.pTeams'),
		},
		{
			optionValue: 'Termine',
			optionText: res.$t('help.chooseTopicArea.text.pCalendar'),
		},
		{
			optionValue: 'Tools',
			optionText: res.$t('help.chooseTopicArea.text.pTools'),
		},
		{
			optionValue: 'Uebersicht',
			optionText: res.$t('help.chooseTopicArea.text.pDashboard'),
		},
		{
			optionValue: 'Verwaltung',
			optionText: res.$t('help.chooseTopicArea.text.pManagement'),
		},
		{
			optionValue: 'Zusatzangebote',
			optionText: res.$t('help.chooseTopicArea.text.pAddOns'),
		},
	];
	const sortedHelpOptions = helpOptions.sort((a, b) => a.optionText.localeCompare(b.optionText));
	return sortedHelpOptions;
};

module.exports = {
	getSortedHelpOtions,
};
