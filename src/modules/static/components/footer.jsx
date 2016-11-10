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
					<a href="https://hpi.de/impressum.html" target="_blank">Impressum</a>
				</div>
				</footer>
		);
	}
}

export default Footer;
