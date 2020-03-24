function clearLocalstorage() {
	// only delete localStorage entries starting with 'mx'
	if (window.localStorage) {
		const allKeys = Object.keys(window.localStorage);
		const mxKeys = allKeys.filter(key => key.indexOf('mx') === 0);
		mxKeys.forEach((key) => {
			window.localStorage.removeItem(key);
		});
	}

	// delete all indexedDB databases
	if (window.indexedDB) {
		window.indexedDB.databases()
			.then((r) => {
				for (let i = 0; i < r.length; i += 1) {
					window.indexedDB.deleteDatabase(r[i].name);
				}
			});
	}
}

clearLocalstorage();
