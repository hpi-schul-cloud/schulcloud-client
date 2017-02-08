import { Permissions, Server } from '../../core/helpers/';

const contentService = Server.service('/contents');

export default {
	findContent: (query, page) => {
		if (query == "") return Promise.resolve({data: []});
		const $limit = 20;
		const $skip = page * $limit;
		return contentService.find({query: {query, $limit, $skip}});
	}
};
