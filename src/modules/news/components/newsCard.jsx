import { Link } from 'react-router';

require('../styles/news.scss');

class NewsCard extends React.Component {


	constructor(props) {
		super(props);

		this.state = {};
	}

	render() {
		var article = this.props;
		var time = Math.floor(Date.now()/1000 - new Date(article.updatedAt).getTime()/1000);
		if(time < 60){ /* < 1 minute */
			var echo = 'just now';
		}else if(time < 3600){ /* < 1 hour */
			var echo = Math.floor(time/60)+' mins ago';
		}else if(time < 86400){ /* < 1 day */
			var echo =Math.floor(time/3600)+' hours ago';
		}else if(time < 604800){ /* < 1 week */
			var echo = Math.floor(time/86400)+' days ago';
		}else{
			var date = new Date();
			var echo = date.getDate().toString()+date.getMonth().toString()+date.getFullYear().toString();
		}
		return (
            <div className="card card-block" key={article._id}>
				<strong className="card-text">{article.title}</strong>
				<p className="card-text">{article.content}</p>
				<p className="card-text"><small className="text-muted">Last updated {echo}</small></p>
				{article.url ? <a href={article.url}> weiterlesen</a> : '' }
			</div>
		);
	}
}

export default NewsCard;
