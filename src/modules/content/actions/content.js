import { Permissions, Server } from '../../core/helpers/';
import _ from 'lodash';

const contentService = Server.service('/contents');

export default {
	findContent: (query, page) => {
		if (query.searchString == "") return Promise.resolve({data: []});
		const $limit = 20;
		page = page || 0;
		const $skip = page * $limit;
		const _query = Object.assign({}, query, {$limit, $skip});
		_query.query = _query.searchString;
		delete _query.searchString;
		return contentService.find({query: _query});
	}
};
