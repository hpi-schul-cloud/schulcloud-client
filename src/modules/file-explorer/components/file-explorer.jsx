import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */

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
			<LayoutBase className="route-file-explorer">
				<SectionTitle title="Dateien" subtitle={this.getSubtitle.bind(this)()} />
				<Upload {...this.props} />
				<Files {...this.props} />
			</LayoutBase>
		);
	}

}

export default FileExplorer;
