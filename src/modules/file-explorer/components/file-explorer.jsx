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
	 * @param data is the files-list
     */
	splitFilesAndDirectories(data) {
		let files = [];
		let directories = [];

		// gets name of current directory
		let values = this.props.storageContext.split("/").filter((v, index) => index > 1);
		let currentDir = values[values.length - 1];
		data.forEach(entry => {
			// the sub-directory is in the second value after the split function
			entry.path.split("/")[1] == "" || (currentDir && entry.path.split("/")[1] == currentDir)
				? files.push(entry)
				: directories.push(entry.path.split("/")[1]);
		});

		// delete duplicates in directories
		let withoutDuplicates = [];
		directories.forEach(d => {
			if (withoutDuplicates.indexOf(d) == -1) withoutDuplicates.push(d);
		});

		// remove .scfake.png fake file
		files = files.filter(f => f.name != ".scfake.png");

		return {
			files: files,
			directories: withoutDuplicates.map(v => {
				return {
					id: RandomIdGenerator.generateRandomId(),
					name: v
				};
			})
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
