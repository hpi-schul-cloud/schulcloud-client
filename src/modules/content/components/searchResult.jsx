import ReactPlayer from 'react-player';
require('../styles/search.scss');

class SearchResult extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const attributes = this.props.result.attributes;
		return (
			<div className="col-sm-4">
				<div className="card">
					{attributes.type == "Online-Video" ?
						<ReactPlayer url={attributes.url} className="card-img-top"
									 youtubeConfig={{preload: true}} playing={false}
									 controls={true}/> :
						<img className="card-img-top" src={attributes.image}
							 alt="Card image cap"/> }
					<div className="card-block">
						<h4 className="card-title">{attributes.title}</h4>
						<p className="card-text">{attributes.description}</p>
						{ (attributes.download) ?
							<button type="button" className="btn btn-secondary">
								<a href={ attributes.download } target="_blank">Slides</a>
							</button> : '' }
						<p>
							<small className="text-muted">
								via {attributes.source} | {new Date(attributes.creationDate).toLocaleDateString("de-DE")}
							</small>
						</p>
					</div>
				</div>
			</div>
		);
	}
}

export default SearchResult;
