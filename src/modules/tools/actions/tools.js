import React from 'react';
import { Server, LTICustomer } from '../../core/helpers';

export default {
	connect: (tool) => {
		var consumer = LTICustomer.createConsumer(tool.key, tool.secret);

		var payload = {
			lti_version: tool.lti_version,
			lti_message_type: tool.lti_message_type,
			resource_link_id: tool.resource_link_id,
			user_id: '12345',
			roles: 'Instructor', // todo: get role from user!
			launch_presentation_document_target: 'window',
			lis_person_name_full: 'John Logie Baird',
			lis_person_contact_email_primary: 'jbaird@uni.ac.uk',
			launch_presentation_locale: 'en'
		};

		tool.customs.forEach((custom) => {
			payload[LTICustomer.customFieldToString(custom)] = custom.value;
		});

		var request_data = {
			url: tool.url,
			method: 'POST',
			data: payload
		};

		LTICustomer.sendRequest(request_data, consumer);
	}
};


