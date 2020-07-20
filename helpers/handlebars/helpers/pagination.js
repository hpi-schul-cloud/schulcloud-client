module.exports = (userSettings, options) => {
	const defaultSettings = {
		numPages: 1,
		maxItems: 10, // how many links are shown in the middle
		showFirst: true,
		showLast: true,
		showPrevious: true,
		showNext: true,
		baseUrl: '', // has to end with = e.g. search?q=css&page=
		currentPage: 1,
	};

	const settings = { ...defaultSettings, ...userSettings };
	settings.baseUrl = decodeURI(settings.baseUrl);

	// only show paginationif it can be actually used
	if (settings.numPages <= 1) {
		return options.fn({ pageItems: [] });
	}

	if (Number.isNaN(settings.currentPage)) {
		settings.currentPage = parseInt(settings.currentPage, 10) || 1;
	}

	const getUrl = (num) => {
		const numString = num.toString();

		if (settings.baseUrl.search('{{page}}')) {
			return settings.baseUrl.replace('{{page}}', numString);
		}

		return settings.baseUrl + numString;
	};

	const addItem = (item) => {
		item.url = getUrl(item.num);
		pageItems.push(item);
	};

	const pageItems = [];

	if (settings.showFirst) {
		addItem({
			first: true,
			disabled: (settings.currentPage === 1),
			num: 1,
		});
	}

	if (settings.showPrevious) {
		addItem({
			previous: true,
			disabled: (settings.currentPage === 1),
			num: (settings.currentPage === 1 ? 1 : settings.currentPage - 1),
		});
	}

	let numItemsLeft = Math.ceil(settings.maxItems / 2) - 1;
	const numItemsRight = settings.maxItems - numItemsLeft - 1;

	if (settings.currentPage + numItemsRight > settings.numPages) { numItemsLeft = settings.maxItems - (settings.numPages - settings.currentPage) - 1; }
	if (settings.currentPage - numItemsLeft < 1) { numItemsLeft = settings.currentPage - 1; }

	let i = 0;
	let start = settings.currentPage - numItemsLeft;

	while (i < settings.maxItems && i < settings.numPages) {
		addItem({
			middle: true,
			num: start,
			active: (start === settings.currentPage),
		});

		start++;
		i++;
	}

	if (settings.showNext) {
		addItem({
			next: true,
			disabled: (settings.currentPage === settings.numPages),
			num: (settings.currentPage === settings.numPages ? settings.numPages : settings.currentPage + 1),
		});
	}

	if (settings.showLast) {
		addItem({
			last: true,
			disabled: (settings.currentPage === settings.numPages),
			num: settings.numPages,
		});
	}

	return options.fn({ pageItems });
};
