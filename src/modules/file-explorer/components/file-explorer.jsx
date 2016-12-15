import LayoutBackend from '../../backend/containers/layout';
import SectionTitle from '../../backend/components/title';  /* only for backend */

import Directories from './directories';
import Upload from './upload';
import Files from './files';

require('../styles/file-explorer.scss');

class FileExplorer extends React.Component {

	constructor(props) {
		super(props);
	}

	getSubtitle() {
		return (
			<div>
				<i className="fa fa-floppy-o" aria-hidden="true"></i> <b>3.10 MB</b> verwendet von <b>5 GB</b>
			</div>
		);
	}

	render() {
		return (
			<LayoutBackend className="route-file-explorer">
				<SectionTitle title="Dateien" subtitle={this.getSubtitle.bind(this)()} />
				<Upload />
				<Directories />
				<Files />
			</LayoutBackend>
		);
	}

}

export default FileExplorer;
