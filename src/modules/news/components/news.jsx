import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */
import NewsEntry from './newsEntry';

require('../styles/news.scss');

class News extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<LayoutBase className="route-news">
				<SectionTitle title="Neuigkeiten" />
				<section className="section-news">
				<div className="container-fluid">
					<div className="row articles">
						<div className="card-group">
							{(this.props.news || []).map((article) => {
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
