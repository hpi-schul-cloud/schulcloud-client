require('../styles/list.scss');

class List extends React.Component {

	constructor(props) {
		super(props);
		this.state = {};
	}

	/* Mock data */
	getInfo() {
		return [{
			firstname: 'Hanz',
			lastname: 'Müller',
			picture: 'https://randomuser.me/api/portraits/men/11.jpg',
			seen: 'jetzt',
			page: 'Dashboard',
			class: 'GY1T'
		},
		{
			firstname: 'Lisa',
			lastname: 'Hoppe',
			picture: 'https://randomuser.me/api/portraits/women/11.jpg',
			seen: 'jetzt',
			class: 'GY1T',
			page: 'Stundenplan'
		},
		{
			firstname: 'David',
			lastname: 'Dietrich',
			picture: 'https://randomuser.me/api/portraits/men/3.jpg',
			seen: 'jetzt',
			class: 'GY1T',
			page: 'Materialiensuche'
		},
		{
			firstname: 'Lena',
			lastname: 'Weiser',
			picture: 'https://randomuser.me/api/portraits/women/33.jpg',
			seen: 'jetzt',
			class: 'GY1T',
			page: 'Office'
		},
		{
			firstname: 'Max',
			lastname: 'Mustermann',
			picture: 'https://randomuser.me/api/portraits/men/21.jpg',
			seen: 'jetzt',
			class: 'GY1T',
			page: 'Mein Profil'
		},
		{
			firstname: 'Jill',
			lastname: 'Werner',
			picture: 'https://randomuser.me/api/portraits/women/21.jpg',
			seen: 'jetzt',
			class: 'GY1T',
			page: 'Geo-gebra'
		},
		{
			firstname: 'Julius',
			lastname: 'Bryant',
			picture: 'https://randomuser.me/api/portraits/men/41.jpg',
			seen: 'jetzt',
			class: 'GY1T',
			page: 'Stundenplan'
		},
			{
				firstname: 'Carl',
				lastname: 'Niemand',
				picture: 'https://randomuser.me/api/portraits/men/2.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Stundenplan'
			},
			{
				firstname: 'Isa',
				lastname: 'Wunsch',
				picture: 'https://randomuser.me/api/portraits/women/5.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Materialiensuche'
			},
			{
				firstname: 'Sophie',
				lastname: 'Keiser',
				picture: 'https://randomuser.me/api/portraits/women/34.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Office'
			},
			{
				firstname: 'Max',
				lastname: 'Himmel',
				picture: 'https://randomuser.me/api/portraits/men/20.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Mein Profil'
			},
			{
				firstname: 'Jessica',
				lastname: 'Müller',
				picture: 'https://randomuser.me/api/portraits/women/15.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Geo-gebra'
			},
			{
				firstname: 'Marie',
				lastname: 'Möre',
				picture: 'https://randomuser.me/api/portraits/women/45.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Stundenplan'
			},
			{
				firstname: 'Franziska',
				lastname: 'Wischer',
				picture: 'https://randomuser.me/api/portraits/women/61.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Stundenplan'
			},
			{
				firstname: 'Jens',
				lastname: 'Pothof',
				picture: 'https://randomuser.me/api/portraits/men/53.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Materialiensuche'
			},
			{
				firstname: 'Tim',
				lastname: 'Weise',
				picture: 'https://randomuser.me/api/portraits/men/55.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Office'
			},
			{
				firstname: 'Mex',
				lastname: 'Mann',
				picture: 'https://randomuser.me/api/portraits/men/25.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Mein Profil'
			},
			{
				firstname: 'Jenny',
				lastname: 'Mix',
				picture: 'https://randomuser.me/api/portraits/women/29.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Geo-gebra'
			},
			{
				firstname: 'Alex',
				lastname: 'Bent',
				picture: 'https://randomuser.me/api/portraits/men/46.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Stundenplan'
			},
			{
				firstname: 'Celine',
				lastname: 'Hip',
				picture: 'https://randomuser.me/api/portraits/women/1.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Stundenplan'
			},
			{
				firstname: 'Melli',
				lastname: 'Nixon',
				picture: 'https://randomuser.me/api/portraits/women/9.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Materialiensuche'
			},
			{
				firstname: 'Maggy',
				lastname: 'Simpson',
				picture: 'https://randomuser.me/api/portraits/women/39.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Office'
			},
			{
				firstname: 'Michael',
				lastname: 'Thomson',
				picture: 'https://randomuser.me/api/portraits/men/46.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Mein Profil'
			},
			{
				firstname: 'Lenny',
				lastname: 'Krüger',
				picture: 'https://randomuser.me/api/portraits/men/65.jpg',
				seen: 'jetzt',
				class: 'GY1T',
				page: 'Geo-gebra'
			},
		{
			firstname: 'Lea',
			lastname: 'Toppe',
			picture: 'https://randomuser.me/api/portraits/women/8.jpg',
			seen: 'vor 2 Minuten',
			class: 'GY1T',
			page: 'Dateinen'
		}];
	}

	getPersonUI() {

		return (
			<div>
				{this.getInfo.bind(this)().map((person) => {
					if (person.seen == 'jetzt'){
						return (
						<tr>
							<td><img className="picture" src={person.picture} alt=""/></td>
							<td>{person.firstname}</td>
							<td>{person.lastname}</td>
							<td><font color="green">{person.seen}</font></td>
							<td>{person.page}</td>
						</tr>
					);}
					else {
						return (
							<tr>
								<td><img className="picture" src={person.picture} alt=""/></td>
								<td>{person.firstname}</td>
								<td>{person.lastname}</td>
								<td><font color="red">{person.seen}</font></td>
								<td>{person.page}</td>
							</tr>
						)
					}
				})}
			</div>
		);
	}

	getClass() {
		return (
			<div>
				<button className="dropdown-item">GY1T</button>
				<button className="dropdown-item">GY2T</button>
				<button className="dropdown-item">GY3T</button>
				<button className="dropdown-item">GY4T</button>
				<button className="dropdown-item">GY5T</button>
				<button className="dropdown-item">GY6T</button>
			</div>
		)
	}

	render() {
		return (
			<section className="Anwesenheit">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Anwesenheitsliste</h5>
						</div>
					</div>
					<div className="row">
						<div className="row">
							<div className="col-sm-8">
								<p>
									Auf dieser Seite werden alle Schüler einer Klasse angezeit, sowie ihre aktuelle Seite und wann sie zuletzt gesehen wurden.
								</p>
								<div className="btn-group">
									<button type="button" className="btn btn-secondary dropdown-toggle class-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
										<strong>Klasse auswählen</strong>
									</button>
									<div className="dropdown-menu dropdown-menu-right">
										{this.getClass()}
									</div>
								</div>
								<table>
									<thead>
									<tr>
										<th>Profilbild</th>
										<th>Vorname</th>
										<th>Nachname</th>
										<th>Zuletzt gesehen</th>
										<th>aktuelle Seite</th>
									</tr>
									</thead>
									<tbody>
									{this.getPersonUI()}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}

}

export default List;
