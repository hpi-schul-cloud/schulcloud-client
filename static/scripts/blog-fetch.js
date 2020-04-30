const feedr = require('feedr');

function fetchBlogs() {
	new Promise((resolve) => {
		feedr.readFeed('https://blog.schul-cloud.org/rss', {
			requestOptions: { timeout: 2000 },
		}, (err, data) => {
			resolve(data);
		});
	}).then((data) => console.log(data));
}

$(document).ready(() => {
	fetchBlogs();
});
