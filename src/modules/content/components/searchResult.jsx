import ReactPlayer from 'react-player';
require('../styles/search.scss');

class SearchResult extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		const result = this.props.result;
		return (
			<div className="col-sm-4">
				<div className="card">
					{result.type == "Online-Video" ?
						<ReactPlayer url={result.url} className="card-img-top"
									 youtubeConfig={{preload: true}} playing={false}
									 controls={true}/> :
						<img className="card-img-top" src={result.image}
							 alt="Card image cap"/> }
					<div className="card-block">
						<h4 className="card-title">{result.title}</h4>
						<p className="card-text">{result.description}</p>
						{ (result.download) ?
							<button type="button" className="btn btn-secondary">
								<a href={ result.download } target="_blank">Slides</a>
							</button> : '' }
						<p>
							<small className="text-muted">
								via {result.source} | {new Date(result.creationDate).toLocaleDateString("de-DE")}
							</small>
						</p>
					</div>
				</div>
			</div>
		);
	}
}

export default SearchResult;
