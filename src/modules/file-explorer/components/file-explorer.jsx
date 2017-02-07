import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */

import Upload from './upload';
import Files from './files';
import {RandomIdGenerator} from '../../core/helpers/';

require('../styles/file-explorer.scss');

class FileExplorer extends React.Component {

	constructor(props) {
		super(props);
	}

	/**
	 * split files-list in files, that are in current directory, and the sub-directories
	 * by a entry's path, which has the form "/" if it's the current directory or "/sub" if it's in a sub-directory
	 * @param data is the files-list
     */
	splitFilesAndDirectories(data) {
		let files = [];
		let directories = [];
		data.forEach(entry => {
			// the sub-directory is in the second value after the split function
			entry.path.split("/")[1] == ""
				? files.push(entry)
				: directories.push({
					id: RandomIdGenerator.generateRandomId(),
					name: entry.path.split("/")[1]
				});
		});
		
		return {
			files: files,
			directories: directories
		};
	}

	getSubtitle() {
		return (
			<div>
				<i className="fa fa-floppy-o" aria-hidden="true"></i> <b>3.10 MB</b> verwendet von <b>5 GB</b>
			</div>
		);
	}

	render() {
		let filesData = this.splitFilesAndDirectories(this.props.filesList);
		return (
			<LayoutBase className="route-file-explorer">
				<SectionTitle title="Dateien" subtitle={this.getSubtitle.bind(this)()} />
				<Upload {...this.props} />
				<Files files={filesData.files} directories={filesData.directories} {...this.props} />
			</LayoutBase>
		);
	}

}

export default FileExplorer;
