import React from 'react';

require('../styles/news.scss');

class SectionNews extends React.Component {

	constructor(props) {
		super(props);
	}

	getArticleUI(article) {
		return (
			<div className="card card-block">
				<p className="card-text">This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>
				<p className="card-text"><small className="text-muted">Last updated 3 mins ago</small></p>
			</div>
		);
	}

	render() {
		return (
			<section className="section-news">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Neuigkeiten</h5>
						</div>
					</div>
					<div className="row articles">
						<div className="card-group">
							{(this.props.articles || []).map((article) => {
								return this.getArticleUI(article);
							})}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default SectionNews;
