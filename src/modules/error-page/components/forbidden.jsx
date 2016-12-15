require('../styles/errormsg.scss');

class Forbidden extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<section className="details">
				<div className="errnumber">
					403
				</div>

				<div className="underline">
					FORBIDDEN :(
				</div>

				<div className="description">
					Ups! Da ist etwas schief gelaufen. <br />
					Du verfügst nicht über die Berechtigungen, <br />
					um auf diese Seite zuzugreifen.
				</div>
			</section>
		);
	}

}

export default Forbidden;
