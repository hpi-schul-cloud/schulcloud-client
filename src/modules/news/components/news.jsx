import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */
import NewsEntry from './newsEntry';

require('../styles/news.scss');

class News extends React.Component {

	constructor(props) {
		super(props);
	}

	sortFunction(a, b) {
	    if (a.updatedAt === b.updatedAt) {
	        return 0;
	    }
	    else {
	        return (a.updatedAt < b.updatedAt) ? 1 : -1;
	    }
	}

	render() {
		return (
			<LayoutBase className="route-news">
				<SectionTitle title="Neuigkeiten" />
				<section className="section-news">
				<div className="container-fluid">
					<div className="row articles">
						<div className="card-group">
							{(this.props.news.sort(this.sortFunction) || []).map((article) => {
								return <NewsEntry {...article} key={article._id}/>;
							})}
						</div>
					</div>
				</div>
			</section>
			</LayoutBase>
		);
	}

}

export default News;
