import { Permissions, Server } from '../../core/helpers/';

const contentService = Server.service('/contents');

export default {
	findContent: query => {
		if (query == "") return Promise.resolve({data: []});
		return contentService.find({query: {search: query}});
	}
};
