import Tools from './containers/tools';
import NewTool from './containers/newTool';

export default [
	{
		path: '/tools/',
		name: 'tools',
		component: Tools
	},
	{
		path: '/tools/new/',
		name: 'newTool',
		component: NewTool
	}
];
