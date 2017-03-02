import _ from 'lodash';
import ReactSelect from 'react-select';

require('../styles/search.scss');

class SectionFilters extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			subjects: this.props.subjects || [],
			grades: this.props.grades || [],
			licenses: this.props.licenses || [],
			editable: this.props.editable || []
		};
	}

	toggleFilter(category, value) {
		console.log(category, value);
		const newFilter = {};
		newFilter[category] = value;
		this.setState(newFilter);
		this.updateQuery(newFilter);
	}

	updateQuery(updatedFilter) {
		let filterCategories = _.pick(this.state, ['subjects', 'grades', 'licenses', 'editable']);
		Object.assign(filterCategories, updatedFilter);
		const filters = _.mapValues(filterCategories, array => {
			return array.map(selectOption => selectOption.value);	// extract the values from ReactSelect's key-value pairs
		});
		this.props.onUpdateFilters(filters);
	}

	getSubjectFiltersUI() {
		// http://agmud.de/wp-content/uploads/2013/09/sgsyst-20121219.pdf
		const subjects = {
			"Arbeitslehre": "020",
			"Berufliche Bildung": "040",
			"Bildende Kunst": "060",
			"Biologie": "080",
			"Chemie": "100",
			"Deutsch": "120",
			"Elementarbereich, Vorschulerziehung": "140",
			"Ethik": "160",
			"Freizeit": "180",
			"Fremdsprachen": "200",
			"Geographie": "220",
			"Geschichte": "240",
			"Gesundheit": "260",
			"Grundschule": "280",
			"Heimatraum, Region": "300",
			"Informationstechnische Bildung": "320",
			"Interkulturelle Bildung": "340",
			"Kinder- und Jugendbildung": "360",
			"Mathematik": "380",
			"Medienpädagogik": "400",
			"Musik": "420",
			"Pädagogik": "440",
			"Philosophie": "450",
			"Physik": "460",
			"Politische bildung": "480",
			"Praxisorientierte Fächer": "500",
			"Psychologie": "510",
			"Religion": "520",
			"Retten, helfen, schützen": "540",
			"Sexualerziehung": "560",
			"Spiel- und Dokumentarfilm": "580",
			"Sport": "600",
			"Sucht und Prävention": "620",
			"Umweltgefährdung, Umweltschutz": "640",
			"Verkehrserziehung": "660",
			"Weiterbildung": "680",
			"Wirtschaftskunde": "700",
			"Sachgebietsübergreifende Medien": "720"
		};

		return (
			<div className="col-sm-12 col-md-6">
				<ReactSelect
					multi={true}
					placeholder="Sachgebiet"
					value={this.state.subjects}
					options={_.map(subjects, (value, key) => ({value: value, label: key}))}
					onChange={this.toggleFilter.bind(this, 'subjects')}
				/>
			</div>
		);
	}

	render() {

		return (
			<div className="filters">
				<div className="row filters-attributes card">
					{this.getSubjectFiltersUI()}
					<div className="col-sm-12 col-md-6">
						<ReactSelect
							multi={true}
							placeholder="Klassenstufe"
							options={[
								{value: "7", label: "7"},
								{value: "8", label: "8"},
								{value: "9", label: "9"}
							]}
							onChange={this.toggleFilter.bind(this, 'grades')}
						/>
					</div>
					<div className="col-sm-12 col-md-6">
						<ReactSelect
							multi={true}
							placeholder="Lizenz"
							options={[
								{value: "gnu", label: "GNU General Public License"},
								{value: "cc", label: "Creative Commons"}
							]}
							onChange={this.toggleFilter.bind(this, 'licenses')}
						/>
					</div>
					<div className="col-sm-12 col-md-6">
						<ReactSelect
							placeholder="Editierbar"
							options={[
								{value: "y", label: "Ja"},
								{value: "n", label: "Nein"}
							]}
							onChange={this.toggleFilter.bind(this, 'editable')}
						/>
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
