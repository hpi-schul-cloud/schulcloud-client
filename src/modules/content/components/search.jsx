import ReactPlayer from 'react-player';
import SearchResult from './searchResult';
import InfiniteScroll from 'react-infinite-scroller';
require('../styles/search.scss');

class SectionSearch extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			query: {searchString: this.props.searchString},
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
									return (<SearchResult result={result} key={result.id} />);
								})}
							</div>
						</div>
					</InfiniteScroll>
				</div>
			);

		}
	}

	getFiltersUI() {
		return (
			<div>
				<div className="row">
					<div className="col-sm-12 no-padding">
						<div className="card filters-attributes">
							<div className="card-block">
								<div className="container-fluid">
									<div className="row">
										<div className="col-sm-3">
											<div className="btn-group">
												<button type="button" className="btn btn-secondary dropdown-toggle"
														data-toggle="dropdown" aria-haspopup="true"
														aria-expanded="false">
													<strong>Fachbereich</strong>
												</button>
												<div className="dropdown-menu dropdown-menu-right">
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															<span>Biologie</span>
														</label>
													</div>
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															Mathe
														</label>
													</div>
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															Deutsch
														</label>
													</div>
												</div>
											</div>
										</div>
										<div className="col-sm-3">
											<div className="btn-group">
												<button type="button" className="btn btn-secondary dropdown-toggle"
														data-toggle="dropdown" aria-haspopup="true"
														aria-expanded="false">
													<strong>Klassenstufe</strong>
												</button>
												<div className="dropdown-menu dropdown-menu-right">
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															7.
														</label>
													</div>
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															8.
														</label>
													</div>
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															9.
														</label>
													</div>
												</div>
											</div>
										</div>
										<div className="col-sm-3">
											<div className="btn-group">
												<button type="button" className="btn btn-secondary dropdown-toggle"
														data-toggle="dropdown" aria-haspopup="true"
														aria-expanded="false">
													<strong>Lizenz</strong>
												</button>
												<div className="dropdown-menu dropdown-menu-right">
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															Frei
														</label>
													</div>
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															GNU General Public License
														</label>
													</div>
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															Creative Commons
														</label>
													</div>
												</div>
											</div>
										</div>
										<div className="col-sm-3">
											<div className="btn-group">
												<button type="button" className="btn btn-secondary dropdown-toggle"
														data-toggle="dropdown" aria-haspopup="true"
														aria-expanded="false">
													<strong>Editierbar</strong>
												</button>
												<div className="dropdown-menu dropdown-menu-right">
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															Ja
														</label>
													</div>
													<div className="form-check">
														<label className="form-check-label">
															<input className="form-check-input" type="checkbox"
																   value=""/>
															Nein
														</label>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-12 no-padding">
						<div className="btn-toolbar filters-type">
							<div className="btn-group">
								<button type="button" className="btn btn-secondary">Alle</button>
								<button type="button" className="btn btn-secondary">Dokumente (20)</button>
								<button type="button" className="btn btn-secondary">Videos (15)</button>
								<button type="button" className="btn btn-secondary">Literatur (10)</button>
								<button type="button" className="btn btn-secondary">Web</button>
								<button type="button" className="btn btn-secondary">Apps</button>
							</div>

							<div className="pull-right" role="group">
								<select className="custom-select" defaultValue="relevance">
									<option value="relevance">Relevanz</option>
									<option value="date">Datum</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
	
	componentDidMount() {
		$('.mobile-filter-toggle').click((e) => {
			$('.filters').toggleClass('active');
			$('.mobile-filter-toggle .fa').toggleClass('fa-filter');
			$('.mobile-filter-toggle .fa').toggleClass('fa-times');
		});
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
					<a className="mobile-filter-toggle">
						Filter <i className="fa fa-filter" />
					</a>
					<div className="filters">
						{this.getFiltersUI.bind(this)()}
					</div>
					<div className="search-results">
						{this.getResultsUI()}
					</div>
				</div>
			</section>
		);
	}

}

export default SectionSearch;
