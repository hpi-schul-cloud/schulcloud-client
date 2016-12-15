import React from 'react';
import { Server, LTICustomer } from '../../core/helpers';
const rolesService = Server.service('/roles');

export default {

	connect: (tool) => {
		var consumer = LTICustomer.createConsumer(tool.key, tool.secret);

		const currentUser = Server.get('user');

		// todo: do this better
		rolesService.find({query: {'_id': currentUser.roles[0]}}).then((result) => {
			let role = result.data[0].name;
			var payload = {
				lti_version: tool.lti_version,
				lti_message_type: tool.lti_message_type,
				resource_link_id: tool.resource_link_id,
				user_id: currentUser._id,
				roles: LTICustomer.mapSchulcloudRoleToLTIRole(role),
				launch_presentation_document_target: 'window',
				lis_person_name_full: 'John Logie Baird', // todo: get from user, wait for populate
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
		});
	}
};


