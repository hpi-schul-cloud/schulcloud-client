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
						<img src="https://hpi.de/fileadmin/templates/img/hpi_header_logo_pos_srgb.png"></img>
						<a>2016 Schul-Cloud </a><i className="fa fa-cloud" aria-hidden="true"></i>
						<a>&emsp;</a>
						<nobr>
							<a href="https://hpi.de/impressum.html" target="blank"><i className="fa fa-info" aria-hidden="true"></i> Impressum </a>
							<a href="mailto:hpi-info@hpi.de?subject=Schul_Cloud%20Anfrage"><i className="fa fa-at" aria-hidden="true"></i> Kontakt</a>
						</nobr>
					</div>
				</div>
			</footer>
		);
	}
}

export default Footer;
