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
					<div className="container-fluid">
						<div className="col-sm-2">
							<a href="https://www.youtube.com/watch?v=3e4iP7ezJDY" target="blank"><i className="fa fa-youtube-play fa-2x" aria-hidden="true"></i><br/>YouTube</a>
						</div>
						<div className="col-sm-2">
							<a href="https://twitter.com/search?q=schul-cloud" target="blank"><i className="fa fa-twitter fa-2x" aria-hidden="true"></i><br/>Twitter</a>
						</div>
						<div className="col-sm-2">
							<a href="https://blog.schul-cloud.org/" target="blank"><i className="fa fa-commenting fa-2x" aria-hidden="true"></i><br/>Blog</a>
						</div>
						<div className="col-sm-2">
							<a href="https://schulcloud.org/datenschutz/" target="blank"><i className="fa fa-lock fa-2x" aria-hidden="true"></i><br/>Datenschutz</a>
						</div>
						<div className="col-sm-2">
							<a href="https://hpi.de/impressum.html" target="blank"><i className="fa fa-info fa-2x" aria-hidden="true"></i><br/>Impressum</a>
						</div>
						<div className="col-sm-2">
							<a href="mailto:hpi-info@hpi.de?Subject=Schul-Cloud%20Anfrage"><i className="fa fa-at fa-2x" aria-hidden="true"></i><br/>Kontakt</a>
						</div>
					</div>
					<div className="underline">
						<img src="https://hpi.de/fileadmin/templates/img/hpi_header_logo_pos_srgb.png"></img>
						<a>2016 Schul-Cloud</a>
					</div>
				</div>
			</footer>
		);
	}
}

export default Footer;
