import {Link} from 'react-router'

require('../styles/footer.scss');

class Footer extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<footer>
				<div className="imprint">
					<div className="center">
						<img src="../../../images/hpi-logo.png" width="235" height="44"></img>
						<a>{new Date().getFullYear()} Schul-Cloud </a><i className="fa fa-cloud" aria-hidden="true"></i>

						<nobr>
							&emsp;- <a href="https://hpi.de/impressum.html" target="blank">Impressum </a>
							 - <a href="mailto:hpi-info@hpi.de?subject=Schul_Cloud%20Anfrage"> Kontakt</a>
						</nobr>
					</div>
				</div>
			</footer>
		);
	}
}

export default Footer;
