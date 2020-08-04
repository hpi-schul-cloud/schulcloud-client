function clearLocalstorage() {
	// only delete localStorage entries starting with 'mx'
	if (window.localStorage) {
		const allKeys = Object.keys(window.localStorage);
		const mxKeys = allKeys.filter((key) => key.indexOf('mx') === 0);
		mxKeys.forEach((key) => {
			window.localStorage.removeItem(key);
		});
	}

	// delete matrix indexedDB databases
	if (window.indexedDB) {
		// window.indexedDB.databases() is not available in all browsers
		const databases = [
			'logs',
			'matrix-js-sdk:crypto',
			'matrix-js-sdk:riot-web-sync',
		];

		for (let i = 0; i < databases.length; i += 1) {
			window.indexedDB.deleteDatabase(databases[i]);
		}
	}
}

clearLocalstorage();
