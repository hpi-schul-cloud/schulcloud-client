import React from 'react';

require('../styles/news.scss');

class SectionNews extends React.Component {

	constructor(props) {
		super(props);
	}

	getArticleUI(article) {
		return (
			<div className="card card-block" key={article.createdAt}>
				<p className="card-text">{article.content}</p>
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
