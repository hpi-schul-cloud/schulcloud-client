import ReactPlayer from 'react-player';
import SearchResult from './searchResult';
import InfiniteScroll from 'react-infinite-scroller';
require('../styles/search.scss');

class SectionSearch extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			query: this.props.query,
			searchResults: [],
			hasMore: false
		};
	}

	handleSearchFieldChange(event) {
		const query = event.target.value;
		this.setState({query});
		this.onChangeQuery(query);
	}

	onChangeQuery(query) {
		this.setState({searchResults: []});
		this.loadMoreItems(0, query);
	}

	loadMoreItems(pageToLoad, query) {
		if(query === undefined) query = this.state.query;
		console.log('loading page', pageToLoad, 'with', query);
		this.props.actions.findContent(query, pageToLoad)
			.then(result => {
				const searchResults = this.state.searchResults.concat(result.data);
				const hasMore = (searchResults.length < result.total);
				console.log('got page', pageToLoad, result.data, 'hasMore', hasMore);
				this.setState({searchResults, hasMore});
			});
	}

	getSearchFieldUI() {
		return (
			<div className="search-wrapper">
				<div className="input-group input-group-lg">
					<input value={this.state.query} type="text" className="form-control search-field"
						   placeholder="Suche nach..." onChange={this.handleSearchFieldChange.bind(this)}/>
				</div>
			</div>
		);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.location.query.q !== this.state.query) {
			this.updateContent(nextProps.location.query.q);
		}
	}

	getResultsUI() {
		const results = this.state.searchResults;
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
							<h5>Suchergebnisse für "{this.state.query}":</h5>
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
