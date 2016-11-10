require('../styles/upload.scss');

import {Link} from 'react-router';

class Upload extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	render() {
		return (
      <div className="upload">
			<Link href="http://hpi.de">
        <i className="fa fa-upload" aria-hidden="true"></i>Hochladen
      </Link>
      </div>
		);
	}

}

export default Upload;
