

require('../styles/material.scss');

class SectionMaterial extends React.Component {

	constructor(props) {
		super(props);
	}

	getData() {






		return [
			{
				id: 1,
				title: "Beebit-Diagramm",
				type: "GeoGebra Buch",
				duration: "3 Kapitel",
				createdAt: "22. Januar 2014 - 15:27",
				description: "Grundsätzlich besteht BeeBIT aus einem Netzwerk von Clients, einem pro eHive, die Messdaten sammeln und an einen zentralen Server senden.",
				url: "https://www.geogebra.org/b/K2CADHJ6",
				image: "https://d3djjx5k976c49.cloudfront.net/material/EmPMJRyEh4jyNkHmEqPW9AZTtFDdheGC/material-QU97VcUE.png"
			},
			{
				id: 2,
				title: "E-Hives",
				type: "GeoGebra Buch",
				duration: "4 Kapitel",
				createdAt: "2. August 2016 - 11:21",
				description: "Ein relativ günstiges System zur Überwachung von Bienenvölkern, dessen Anschaffungshürde durch die geringen finanziellen und …",
				url: "https://www.geogebra.org/b/mKgpSHBY",
				image: "https://d3djjx5k976c49.cloudfront.net/material/bRZ3lahcl5gt2tfEJwQoLw2kpBmiDYSs/material-We7j4s5V.png"
			},
			{
				id: 3,
				title: "E-Hives",
				type: "GeoGebra Bucho",
				duration: "9 Kapitel",
				createdAt: "23. Dezember 2015 - 11:26",
				description: "Ein relativ günstiges System zur Überwachung von Bienenvölkern, dessen Anschaffungshürde durch die geringen finanziellen und …",
				url: "https://www.geogebra.org/b/RzsgsgR7",
				image: "https://d3djjx5k976c49.cloudfront.net/material/2Q353bYTqJ52Lttgs1eKlHnEFOZjS4QG/material-PQ3neaNh.png"
			}
		];
	}

	render() {
		return (
			<section className="section-material">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Arbeitsmaterialien</h5>
						</div>
					</div>
					<div className="row materials">
						<div className="row">
							<div className="col-sm-12 no-padding">
								{this.getData.bind(this)().map((material) => {
									return (
										<div className="col-sm-4 material">
											<div className="row">
												<div className="col-sm-4">
													<div className="doc-preview" />
												</div>
												<div className="col-sm-6">
													<p className="doc-title">{material.title}</p>
													<p className="doc-text">{material.description}</p>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default SectionMaterial;
