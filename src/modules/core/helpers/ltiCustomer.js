const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

class LTICustomer {
	constructor() {}

	createConsumer(key, secret) {
		return OAuth({
			consumer: {
				key: key,
				secret: secret
			},
			signature_method: 'HMAC-SHA1',
			hash_function: function(base_string, key) {
				return crypto.createHmac('sha1', key).update(base_string).digest('base64');
			}
		});
	}

	sendRequest(request_data, consumer) {
		var name,
			form = document.createElement("form"),
			node = document.createElement("input");


		form.action = request_data.url;
		form.method = request_data.method;
		form.target = "_blank";

		var formData = consumer.authorize(request_data);

		for (name in formData) {
			node.name = name;
			node.value = formData[name].toString();
			form.appendChild(node.cloneNode());
		}

		// To be sent, the form needs to be attached to the main document.
		form.style.display = "none";
		document.body.appendChild(form);

		form.submit();

		// But once the form is sent, it's useless to keep it.
		document.body.removeChild(form);
	}

	customFieldToString(custom) {
		return `custom_${custom.key}`;
	}
}

export default new LTICustomer();
