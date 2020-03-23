function clearLocalstorage() {
	if (window.localStorage) {
		const allKeys = Object.keys(window.localStorage);
		const mxKeys = allKeys.filter(key => key.indexOf('mx') === 0);
		mxKeys.forEach((key) => {
			window.localStorage.removeItem(key);
		});
	}
}

clearLocalstorage();
