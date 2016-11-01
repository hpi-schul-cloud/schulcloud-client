import Helpers from '../helpers';

let modules = {};

export default {

	SetupModules: (modules) => {
		Object.values(modules).forEach((module, key) => {
			Helpers.Module.SetupModule(module, key);
		});
	},

	SetupModule: (module, key) => {
		modules[key] = module;

		(module.Routes || []).forEach((route) => {
			Helpers.Router.AddRoute(route);
		});
	},

	GetModule: (key) => {
		return modules[key];
	}

};
