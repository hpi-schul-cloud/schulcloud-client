

require('../styles/messages.scss');

class SectionMessages extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<section className="section-messages">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-7">
							<div className="row">
								<h5>Briefkasten <span className="tag tag-default">23</span></h5>
							</div>

							<div className="row messages">
								<div className="row message">
									<div className="col-sm-2">
										<img className="avatar" src="https://randomuser.me/api/portraits/men/1.jpg" /><strong>Tom</strong>
									</div>
									<div className="col-sm-10">
										<h6>[Schulfest] Am 31.März findet unser Alljährliches Schulfest statt</h6>
										<p>Liebe Lehrer, liebe Mitschüler, im Namen der Schulversammlung lade ich Euch und eure Familien ganz herzlich zum Schulfest im nächsten Monat ein. Beginn ist um 15 Uhr in der Aula. Im Anschluss bieten wir verschiedene Attraktionen wie Kuchenverkauf, Beatboxen und Fußball an. <a href="#">Ablaufplan</a></p>
									</div>
								</div>

								<div className="row message">
									<div className="col-sm-2">
										<img className="avatar" src="https://randomuser.me/api/portraits/women/91.jpg" /><strong>Jana</strong>
									</div>
									<div className="col-sm-10">
										<h6>[Projekt] Abgabe Physik-Projekt am Dienstag</h6>
										<p>Bis Dienstag müssen noch die Details zu Magnetfeldern und Stromleitern auf unser Plakat. Könntest du das übernehmen, Jens? Katrin und ich kümmern uns in der Zwischenzeit um die schriftliche Ausarbeitung. Treffen wir uns nach der 8ten Stunde noch in der Bibliothek?</p>
									</div>
								</div>
							</div>
						</div>
						<div className="col-sm-4 offset-sm-1">
							<div className="row">
								<h5>Mitteilungen</h5>
							</div>
							<div className="row notices">
								<div className="row notice">
									<div className="col-sm-12">
										<div className="alert alert-warning alert-dismissible" role="alert">
											<button type="button" className="close" data-dismiss="alert" aria-label="Close">
												<span aria-hidden="true">&times;</span>
											</button>
											<strong>Mathe (17. November 2016, 1. + 2. Stunde):</strong> <br />Fällt aus.
										</div>
									</div>
								</div>
								<div className="row notice">
									<div className="col-sm-12">
										<div className="alert alert-info alert-dismissible" role="alert">
											<button type="button" className="close" data-dismiss="alert" aria-label="Close">
												<span aria-hidden="true">&times;</span>
											</button>
											<strong>Englisch (18. November 2016, 1. + 2. Stunde):</strong> <br />Vertretung durch Herrn Müller.
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default SectionMessages;
