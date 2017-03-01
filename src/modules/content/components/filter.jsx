import _ from 'lodash';
require('../styles/search.scss');

class SectionFilters extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			subjects: new Set(this.props.subjects),
			grades: new Set(this.props.grades),
			licenses: new Set(this.props.licenses),
			editable: new Set(this.props.editable)
		};
	}

	toggleFilter(category, value) {
		const filter = this.state[category];
		if (filter.has(value)) {
			filter.delete(value);
		} else {
			filter.add(value);
		}
		const newFilter = {};
		newFilter[category] = filter;
		this.setState(newFilter);
		this.updateQuery(newFilter);
	}

	updateQuery(newFilter) {
		const filters = _.pick(this.state, ['subjects', 'grades', 'licenses', 'editable']);
		Object.assign(filters, newFilter);
		this.props.onUpdateFilters(filters);
	}

	getSubjectFiltersUI() {
		const subjects = {
			Biologie: "640",
			Mathematik: "380",

		};
		return (
			<div className="col-sm-3">
				<div className="btn-group">
					<button type="button" className="btn btn-secondary dropdown-toggle"
							data-toggle="dropdown" aria-haspopup="true"
							aria-expanded="false">
						<strong>Fachbereich</strong>
					</button>
					<div className="dropdown-menu dropdown-menu-right">
						{_.map(subjects, (value, key) => (
							<div className="form-check">
								<label className="form-check-label">
									<input className="form-check-input" type="checkbox"
										   value={key}
										   checked={this.state.subjects.has(value)}
										   onChange={this.toggleFilter.bind(this, 'subjects', value)}
									/>
									<span>{key}</span>
								</label>
							</div>
						))}

					</div>
				</div>
			</div>
		);
	}

	render() {

		return (
			<div className="filters">
				<div className="row">
					<div className="col-sm-12 no-padding">
						<div className="card filters-attributes">
							<div className="card-block">
								<div className="container-fluid">
									<div className="row">
										{this.getSubjectFiltersUI()}
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

}

export default SectionFilters;
