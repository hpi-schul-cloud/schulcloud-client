import Permissions from './permissions';
import News from './containers/news';
import NewsEntry from './containers/newsEntry';

export default [
	{
		path: '/news/',
		name: 'news',
		component: News
	},
        {
		path: '/news/:createdAt',
		name: 'newsEntry',
		component: NewsEntry
	}
];