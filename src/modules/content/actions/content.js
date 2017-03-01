import { Permissions, Server } from '../../core/helpers/';

const contentService = Server.service('/contents');

export default {
	findContent: (query, page) => {
		if (query.searchString == "") return Promise.resolve({data: []});
		const $limit = 20;
		const $skip = page * $limit;
		Object.assign(query, {$limit, $skip});
		return contentService.find({query: query});
	}
};
