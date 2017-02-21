import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */

import Upload from './upload';
import Files from './files';
import Navigation from './navigation';
import {RandomIdGenerator} from '../../core/helpers/';

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
				<div className="row">
					<div className="col-md-2 col-xs-12 left">
						<Navigation {...this.props} />
					</div>
					<div className="col-md-10 col-xs-12 main">
						<Upload {...this.props} />
						<Files {...this.props} />
					</div>
				</div>
			</LayoutBase>
		);
	}

}

export default FileExplorer;
