import SectionFilters from './filter';
import SearchResult from './searchResult';
import InfiniteScroll from 'react-infinite-scroller';
import _ from 'lodash';
require('../styles/search.scss');

class SectionSearch extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			query: {
				searchString: this.props.searchString,
				filter: {
					subjects: new Set(),
					grade: new Set(),
					license: new Set(),
					editable: new Set()
				}
			},
			searchResults: [],
			hasMore: false
		};
	}

	componentDidMount() {
		this.loadItems(0, this.state.query);
	}

	handleSearchFieldChange(event) {
		const searchString = event.target.value;
		const newQuery = Object.assign({}, this.state.query, {searchString});
		this.setState({query: newQuery});
		// setState may not update the state immediately,
		// so pass the new query as a parameter
		this.onChangeQuery(newQuery);
	}

	onChangeQuery(query) {
		this.setState({searchResults: []});
		this.loadItems(0, query);
	}

	loadMoreItems(pageToLoad) {
		console.log('loading page', pageToLoad, 'with', this.state.query);
		this.loadItems(pageToLoad, this.state.query);
	}

	loadItems(pageToLoad, query) {
		this.props.actions.findContent(query, pageToLoad)
			.then(result => {
				const searchResults = this.state.searchResults.concat(result.data);
				const hasMore = (searchResults.length < result.total);
				console.log('got page', pageToLoad, 'for query', query, result.data, 'hasMore:', hasMore);
				this.setState({searchResults, hasMore});
			});
	}

	getSearchFieldUI() {
		return (
			<div className="search-wrapper">
				<div className="input-group input-group-lg">
					<input value={this.state.query.searchString} type="text" className="form-control search-field"
						   placeholder="Suche nach..." onChange={this.handleSearchFieldChange.bind(this)}/>
				</div>
			</div>
		);
	}

	componentWillReceiveProps(nextProps) {
		const searchString = nextProps.location.query.q;
		if (searchString !== this.state.query.searchString) {
			const newQuery = Object.assign({}, this.state.query, {searchString});
			this.setState({query: newQuery});
			this.onChangeQuery(newQuery);
		}
	}

	getResultsUI() {
		const results = this.state.searchResults;
		console.log(results);
		if (results.length == 0) {
			return (
				<div className="row">
					<div className="col-sm-12 no-padding">
						<p className="text-muted text-center">
							<span>Keine Suchergebnisse.</span>
						</p>
					</div>
				</div>
			);
		} else {
			return (
				<div>
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Suchergebnisse für "{this.state.query.searchString}":</h5>
						</div>
					</div>
					<InfiniteScroll
						loadMore={this.loadMoreItems.bind(this)}
						hasMore={this.state.hasMore}
						loader={<div className="loader">Loading ...</div>}>
						<div className="row">
							<div className="row results">
								{results.map((result) => {
									return (<SearchResult result={result} key={result.id}/>);
								})}
							</div>
						</div>
					</InfiniteScroll>
				</div>
			);

		}
	}


	updateFilters(filters) {
		this.setState((previousState) => _.merge({}, previousState, {query: {filter: filters}}));
		const updatedQuery = Object.assign({}, this.state.query, {filter: filters});
		this.onChangeQuery(updatedQuery);
	}

	render() {
		return (
			<section className="section-search">
				<div className="container-fluid">
					<div className="row search-bar">
						<div className="row">
							<div className="col-sm-12">
								{this.getSearchFieldUI.bind(this)()}
							</div>
						</div>
					</div>
					<SectionFilters onUpdateFilters={this.updateFilters.bind(this)}/>
					<div className="search-results">
						{this.getResultsUI()}
					</div>
				</div>
			</section>
		);
	}

}

export default SectionSearch;
