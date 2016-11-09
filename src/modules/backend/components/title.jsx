import {Link} from 'react-router';

require('../styles/title.scss');

class SectionTitle extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			query: ''
		}
	}

	getLocationUI() {
		if(!this.props.location) return '';

		let locationUI;
		if(this.props.location == 'school') {
			locationUI = (
				<div className="location-info" >
					<Link to={{ pathname: '/dashboard/', query: { l: 'home' }}}>
						<i className="fa fa-graduation-cap" /> <span>in der Schule</span>
					</Link>
				</div>
			);
		} else {
			locationUI = (
				<div className="location-info">
					<Link to={{ pathname: '/dashboard/', query: { l: 'school' }}}>
						<i className="fa fa-home" /> <span>zu Hause</span>
					</Link>
				</div>
			);
		}

		return locationUI;
	}

	setQuery(event) {
		this.setState({
			query:event.target.value
		});
	}

	getSearchFieldUI() {
		return (
			<div className="search-wrapper">
				<div className="input-group input-group-sm">
					<input type="text" className="form-control search-field" placeholder="Search for..."  onChange={this.setQuery.bind(this)} />
					<span className="input-group-btn">
						<Link className="btn btn-secondary" to={{ pathname: '/content/', query: { q: this.state.query } }}>
							<i className="fa fa-search" />
						</Link>
					</span>
				</div>
			</div>
		);
	}

	render() {
		return (
			<section className="section-title">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-9 no-padding">
							<div>
								<h4>{this.props.title}</h4>
								{this.getLocationUI.bind(this)()}
							</div>
							<div>
								{this.props.subtitle}
							</div>
						</div>
						<div className="col-sm-3 no-padding">
							{this.getSearchFieldUI.bind(this)()}
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default SectionTitle;
