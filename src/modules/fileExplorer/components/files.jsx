require('../styles/files.scss');

class Files extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}

	/* Mock data */
	getData() {
		return [{
			name: 'Aufgabe1.docx',
			type: 'Word-Dokument',
			thumbnail: 'https://vebu.de/wp-content/uploads/2015/12/beitragsbild_690x460_bienen_industriell-690x460.jpg'
		},
		{
			name: 'Aufgabe2.docx',
			type: 'Word-Dokument',
			thumbnail: 'https://www.hauenstein-rafz.ch/de-wAssets/img/pflanzenwelt/sammelsurium/bienenweidepflanzen/Biene_12.jpg'
		},
		{
			name: 'Bienen.jpg',
			type: 'Bildressource',
			thumbnail: 'http://www.br-online.de/kinder/fragen-verstehen/wissen/2003/00278/bienenwabe_dpa482.jpg'
		}];
	}

	getFilesUI() {
		return (
		<div>
		{this.getData.bind(this)().map((file) => {
			return (
				<div className="col-sm-4 col-xs-12 col-md-4" key={file.name}>
					<div className="card">
						<img className="card-img-top" src={file.thumbnail} alt="Card image cap" />
						<div className="card-block">
							<p className="card-text">{file.name}</p>
							<p className="card-text">{file.type}</p>
							<p><small className="text-muted">17. November 2016</small></p>
						</div>
					</div>
				</div>
			);
		})}
			</div>
		);
	}

	render() {
		return (
			<section className="files">
				<div className="container-fluid">
					<strong>Meine Dateien</strong>
					<div className="row">
						{this.getFilesUI()}
					</div>
				</div>
			</section>
		);
	}

}

export default Files;
