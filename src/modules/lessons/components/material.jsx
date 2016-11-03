

require('../styles/material.scss');

class SectionMaterial extends React.Component {

	constructor(props) {
		super(props);
	}

	getData() {
		return [
			{
				id: 1,
				title: "GeoGebra Buch: KidZ - 5. Schulstufe",
				type: "GeoGebra Buch",
				duration: "3 Kapitel",
				createdAt: "22. Januar 2014 - 15:27",
				description: "GeoGebraBook für die 5. Schulstufe zu den Themen Quader, Kreis und Symmetrie",
				url: "https://www.geogebra.org/b/K2CADHJ6",
				image: "https://d3djjx5k976c49.cloudfront.net/material/EmPMJRyEh4jyNkHmEqPW9AZTtFDdheGC/material-QU97VcUE.png"
			},
			{
				id: 2,
				title: "GeoGebra Buch: Kreisteile",
				type: "GeoGebra Buch",
				duration: "4 Kapitel",
				createdAt: "2. August 2016 - 11:21",
				description: "GeoGebra Buch: Kreisteile.",
				url: "https://www.geogebra.org/b/mKgpSHBY",
				image: "https://d3djjx5k976c49.cloudfront.net/material/bRZ3lahcl5gt2tfEJwQoLw2kpBmiDYSs/material-We7j4s5V.png"
			},
			{
				id: 3,
				title: "GeoGebra Buch: Die Welt der Drei- und Vierecke",
				type: "GeoGebra Bucho",
				duration: "9 Kapitel",
				createdAt: "23. Dezember 2015 - 11:26",
				description: "Autor: Hubert Pöchtrager. Lernmaterial und Bilder: Paula Pöchtrager (GeoGebra-Arbeitsblätter und Bilder), Hubert Pöchtrager (GeoGebra-Arbeitsblätter, Learningapps und Bilder). Videos: Sandra Reichenberger und Manuel Graf",
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
							<h5>Material</h5>
						</div>
					</div>
					<div className="row materials">
						<div className="row">
							<div className="col-sm-12 no-padding">
								{this.getData.bind(this)().map((material) => {
									return (
										<div className="col-sm-3 material">
											<div className="card">
												<img className="card-img-top" src={material.image} alt="Card image cap" />
												<div className="card-block">
													<h4 className="card-title">{material.title}</h4>
													<p className="card-text">{material.description}</p>
													<a className="btn btn-primary btn-block" href={material.url} target="_blank">Ansehen</a>
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
