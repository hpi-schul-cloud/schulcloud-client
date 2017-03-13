import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */

import NewsCard from './newsCard';

require('../styles/news.scss');

class NewsSection extends React.Component {

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
            <section className="section-news">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Neuigkeiten</h5>
							<a href="/news" id="showAll" className="btn btn-secondary">
								Alle anzeigen
							</a>
						</div>
					</div>
					<div className="row articles">
						<div className="card-group">
							{(this.props.news.sort(this.sortFunction).slice(0, 4) || []).map((article) => {
								return <NewsCard {...article} key={article._id}/>;
							})}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default NewsSection;
