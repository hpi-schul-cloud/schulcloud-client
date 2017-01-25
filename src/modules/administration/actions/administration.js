import { Permissions, Server } from '../../core/helpers/';

const userService = Server.service('/users');
const classService = Server.service('/classes');

const indexArrayByKey = (array, key) => {
	const result = {};
	array.forEach((obj) => {
		result[obj[key]] = obj;
	});
	return result;
};

export default {

	loadContent: (serviceName, query) => {
		const service = Server.service(serviceName);
		return service.find({query})
			.then(result => {
				return Promise.resolve({
					records: indexArrayByKey(result.data, '_id'),
					pagination: {total: result.total, skip: result.skip}
				});
		});
	},

	updateRecord: (serviceName, data) => {
		const service = Server.service(serviceName);
		if(data._id) return service.patch(data._id, data);
		return service.create(data);
	},

	removeRecord: (serviceName, data) => {
		const id = data._id;
		if(!id) throw new Error("_id not set!");
		const service = Server.service(serviceName);
		return service.remove(id);
	},

	populateFields: (serviceName, _id, fields) => {
		const service = Server.service(serviceName);
		return service.find({query: {
			_id,
			$populate: fields
		}});
	},

	_loadTeachers: (schoolId) => {
		return userService.find({
			query: {
				schoolId,
				roles: ['teacher'],
				$limit: 1000
			}
		})
			.then(result => Promise.resolve(result.data));
	},

	_loadClasses: (schoolId) => {
		return classService.find({
			query: {
				schoolId,
				$limit: 1000
			}
		})
			.then(result => Promise.resolve(result.data));
	}
};
