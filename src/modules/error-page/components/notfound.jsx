require('../styles/errormsg.scss');

class NotFound extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<section className="details">
				<div className="errnumber">
					404
				</div>

				<div className="underline">
					NOT FOUND :(
				</div>

				<div className="description">
					Ups! Da ist etwas schief gelaufen. <br />
					Diese Seite existiert (noch) nicht, <br />
					bitte versuche es auf einem andern Weg.
				</div>
			</section>
		);
	}

}

export default NotFound;
