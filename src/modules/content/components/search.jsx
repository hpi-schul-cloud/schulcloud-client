

require('../styles/search.scss');

class SectionSearch extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			query: (this.props.location.query || {}).q || ''
		}
	}

	getData() {
		return [
			{
				id: 1,
				title: "Phase III - 149: Vernetzte Bienen, Fahrradlobbyisten und Spielausgrabungen",
				type: "Online-Video",
				duration: "15 min",
				createdAt: "2015",
				description: "Vernetzte Bienen - Bienen gehören zu den ältesten Nutztieren der Menscheit und können untereinander komplexe Informationen austauschen.",
				url: "https://xplay.datenbank-bildungsmedien.net/5f5d32e7735b1124b642757dde62364a/shpool-56508/ZDF-ER3_149.mp4",
				image: "https://vebu.de/wp-content/uploads/2015/12/beitragsbild_690x460_bienen_industriell-690x460.jpg"
			},
			{
				id: 2,
				title: "Preetz - eine Stadt mit Herz für Bienen (HD)",
				type: "Online-Video",
				duration: "ca. 10 min",
				createdAt: "2016",
				description: "Moderatorin Vèrena Püschel ist heute auf Spurensuche in Preetz unterwegs, in der offiziell 'bienenfreundlichsten Stadt' in Schleswig-Holstein.",
				url: "https://xplay.datenbank-bildungsmedien.net/4c12ec3aa3ecb349e15fc377fdb4191d/ndr-57212-p/NDR-SH_18_Uhr-Preetz-eine_Stadt_mit_Herz_fuer_Bienen-HD_ndr160803.mp4?play",
				image: "https://www.hauenstein-rafz.ch/de-wAssets/img/pflanzenwelt/sammelsurium/bienenweidepflanzen/Biene_12.jpg"
			},
			{
				id: 3,
				title: "Warum brauchen wir Bienen?",
				type: "Online-Video",
				duration: "15 min",
				createdAt: "2014",
				description: "Kaum ein Tier wird so geschätzt wie die Biene: Arbeit, Ordnungssinn und perfekte Zusammenarbeit kennzeichnen ihr Leben.",
				url: "https://xplay.datenbank-bildungsmedien.net/ac6d30210e364766b02be3856df7931e/sf-43533-p/Bienenstatt_in_Gefahr-Warum_brauchen_wir_Bienen.mp4?play",
				image: "http://www.br-online.de/kinder/fragen-verstehen/wissen/2003/00278/bienenwabe_dpa482.jpg"
			},
			{
				id: 4,
				title: "Bienen, gefährdete Gedächtniskünstler",
				type: "Online-Audio",
				duration: "24 min",
				createdAt: "2016",
				description: "Regina Oehler im Gespräch mit dem Neurobiologen Professor Randolf Menzel",
				url: "https://xplay.datenbank-bildungsmedien.net/7843cde14dfe65359d7e6fcf5a7552f6/sf-57614/hr2-Bienen-gefaehrdete_Gedaechtniskuenstler.mp3",
				image: "http://www.deutschland-summt.de/files/bilder_ds/content/bienenmenu/bienenfreundlich_gaertnern/bienen%20und%20blumen/Colletes%20sp_Hans%20Juergen%20Sessner.jpg"
			},
			{
				id: 5,
				title: "Bienenfresser - Steckbrief",
				type: "Online-Dokument",
				createdAt: "2016",
				description: "Der Link führt zum Online-Steckbrief des im Titel genannten Tiers. Der Steckbrief ist auch für Kinder verständlich.",
				url: "https://hamburg.edupool.de/home?pid=fm2iu327bmtap88sih97f0ep96",
				image: "https://origin.img.fotocommunity.com/anflug-bienenfresser-cef0d19f-51f7-4420-ab7b-0f2777ecb934.jpg?width=1000"
			},
			{
				id: 6,
				title: "Bienen und Schadstoffe - Gemeinschaft puffert Wirkung von Schadstoffen",
				type: "Online-Audio",
				duration: "4 min",
				createdAt: "2014",
				description: "Die Wirkung von Pflanzenschutzmitteln und anderen Schadstoffen auf Bienen zu untersuchen ist schwierig.",
				url: "https://xplay.datenbank-bildungsmedien.net/6e04ff75f35694fb2a37e959711c55c8/shpool-44026/DLF-Bienen_und_Schadstoffe-Gemeinschaft_puffert_Wirkung_von_Schadstoffen.mp3",
				image: "https://www.regenwald.org/uploads/photos/article/wide/l/biene-blume-gelb.jpg"
			},
			{
				id: 7,
				title: "Heftklammern; Hostien; Honig; Hochseilartisten",
				type: "Didaktisches Medium",
				duration: "30 min",
				createdAt: "2010",
				description: "HEFTKLAMMERN: Drahtstückchen, gewalzt, geschnitten, gebogen und geleimt, das sind die Heftklammern, mit denen man im Büro – oder sonstwo – mehrere Seiten Papier zusammenheften kann.",
				url: "https://hamburg.edupool.de/home?pid=fm2iu327bmtap88sih97f0ep96",
				image: "http://www.agrarheute.com/sites/default/files/styles/ah_teaser_galerie_640x480/public/media/537350/537350_0.jpg"
			},
			{
				id: 8,
				title: "Die Bienenretter",
				type: "Online-Video",
				duration: "30 min",
				createdAt: "2015",
				description: "Äpfel, Erdbeeren, Gurken, Honig: Etwa ein Drittel unserer Nahrung hängt von Pflanzen ab, die von Bienen bestäubt werden.",
				url: "https://xplay.datenbank-bildungsmedien.net/9a4e47f197de501a833a690c777bbc24/ndr-51691-p/NDR-Die_Bienenretter-HD.mp4?play",
				image: "http://www.welovefamily.at/wp-content/uploads/2016/05/lukas-bienenretter-696x464.jpg"
			}
		];
	}


	setQuery(event) {
		this.setState({
			query:event.target.value
		});
	}


	getSearchFieldUI() {
		return (
			<div className="search-wrapper">
				<div className="input-group input-group-lg">
					<input value={this.state.query} type="text" className="form-control search-field" placeholder="Search for..." onChange={this.setQuery.bind(this)} />
				</div>
			</div>
		);
	}

	getResultsUI() {
		const query = this.state.query;
		if(query != 'Biene' && query != 'Bienen' && query != 'biene' && query != 'bienen') {
			return (
				<div className="row">
					<div className="col-sm-12 no-padding">
						<p className="text-muted text-center">
							<span>Keine Suchergebnisse.</span>
						</p>
					</div>
				</div>
			);
		} else {
			return (
				<div>
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Suchergebnisse für "{this.state.query}":</h5>
						</div>
					</div>
					<div className="row">
						<div className="row results">
							{this.getData.bind(this)().map((result) => {
								return (
									<div className="col-sm-4">
										<div className="card">
											<img className="card-img-top" src={result.image} alt="Card image cap" />
											<div className="card-block">
												<h4 className="card-title">{result.title}</h4>
												<p className="card-text">{result.description}</p>
												<p><small className="text-muted">via natur.org | 17. November 2016</small></p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			);

		}
	}

	getFiltersUI() {
		return (
			<div>
				<div className="row">
					<div className="col-sm-12 no-padding">
						<div className="card filters-attributes">
							<div className="card-block">
								<div className="container-fluid">
									<div className="row">
										<div className="col-sm-4">
											<strong>Fachbereich</strong>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> Biologie
												</label>
											</div>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> Mathe
												</label>
											</div>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> Deutsch
												</label>
											</div>
										</div>
										<div className="col-sm-4">
											<strong>Klassenstufe</strong>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> 7.
												</label>
											</div>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> 8.
												</label>
											</div>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> 9.
												</label>
											</div>
										</div>
										<div className="col-sm-4">
											<strong>Lizenz</strong>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> Frei
												</label>
											</div>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> GPL
												</label>
											</div>
											<div className="form-check">
												<label className="form-check-label">
													<input className="form-check-input" type="checkbox" value="" /> CC
												</label>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div className="row">
					<div className="col-sm-12 no-padding">
						<div className="btn-toolbar filters-type">
							<div className="btn-group">
								<button type="button" className="btn btn-secondary">Alle</button>
								<button type="button" className="btn btn-secondary">Dokumente (20)</button>
								<button type="button" className="btn btn-secondary">Videos (15)</button>
								<button type="button" className="btn btn-secondary">Literatur (10)</button>
								<button type="button" className="btn btn-secondary">Web</button>
								<button type="button" className="btn btn-secondary">Apps</button>
							</div>

							<div className="pull-right" role="group">
								<select className="custom-select">
									<option selected value="relevance">Relevanz</option>
									<option value="date">Datum</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	render() {
		return (
			<section className="section-search">
				<div className="container-fluid">
					<div className="row search-bar">
						<div className="row">
							<div className="col-sm-12">
								{this.getSearchFieldUI.bind(this)()}
							</div>
						</div>
					</div>
					<div className="filters">
						{this.getFiltersUI.bind(this)()}
					</div>
					<div className="search-results">
						{this.getResultsUI.bind(this)()}
					</div>
				</div>
			</section>
		);
	}

}

export default SectionSearch;
