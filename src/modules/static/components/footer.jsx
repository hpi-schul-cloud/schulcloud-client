import {Link} from 'react-router'

require('../styles/footer.scss');
require('../../../static/images/hpi-logo.png');

class Footer extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<footer>
				<div className="imprint">
					<div className="center">
						<img src="/images/hpi-logo.png" width="235" height="44"></img>
						<a>&copy; {new Date().getFullYear()} Schul-Cloud </a>

						<nobr>
							<span> - </span>
							<a href="https://hpi.de/impressum.html" target="blank">Impressum</a>
							<span> - </span>
							<a href="mailto:hpi-info@hpi.de?subject=Schul_Cloud%20Anfrage">Kontakt</a>
						</nobr>
					</div>
				</div>
			</footer>
		);
	}
}

export default Footer;
