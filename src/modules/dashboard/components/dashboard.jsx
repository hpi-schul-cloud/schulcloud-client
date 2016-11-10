

import LayoutBackend from '../../backend/components/layout';
import SectionTitle from '../../backend/components/title';
import SectionTimetable from '../../timetable/components/table';
import SectionControls from '../../timetable/components/controls';
import SectionTools from './tools';
import SectionNews from './news';
import SectionMessages from './messages';
import SectionTasks from './tasks';
import { Link } from 'react-router';

require('../styles/dashboard.scss');

class Dashboard extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const tools = [{
			label: 'Office',
			icon: 'pencil'
		},{
			label: 'Kalender',
			icon: 'calendar'
		},{
			label: 'Gruppen',
			icon: 'group'
		},{
			label: 'Video',
			icon: 'camera'
		}];

		const articles = [{
			title: 'Willkommen im Schuljahr 2016!',
			content: 'Die Schulleitung heißt alle (neuen) Schüler im Neuen Schuljahr Willkommen. Auch dieses Jahr haben wir wieder viele neue Veranstaltungen für euch geplant. Unter anderem ein Besuch bei der UNESCO und einen Schüleraustausch mit dem Silicon Valley der Klasse 10. Viel Erfolg wünscht Ihnen das Lehrerkolleg!',
			createdAt: 12345678,
			url: '#'
		},{
			title: 'Forschungsprojekt Umwelt',
			content: 'Um die Energieeffizienz von Elektroautos zu beweisen führten die Schüler der 11. Klasse in den vergangenen Monaten verschiedene Experimente durch. Unter anderem mit einem Tesla Model X auf der Langstrecke von Berlin nach Köln. Hierbei fanden sie heraus, dass insgesamt nur ¼ der Energie der konventionellen Treibstoffe benötigt wurde.',
			createdAt: 12345679,
			url: '#'
		},{
			title: 'Preisverleihung Sommerfestspiele',
			content: 'Auch in diesem Jahr gab es wieder herausragende Sportliche Leistungen. Unter Anderem ein neuer Schulrekord im 100m Lauf bei den Mädchen und beim Weitsprung der Jungen. Auch für die Versorgung mit Wasser und Energieriegel wurde durch den Förderverein gesorgt. Die Urkundenübergabe findet am 30. Juni in der Sporthalle um 13 Uhr statt.',
			createdAt: 12345680,
			url: '#'
		},{
			title: 'Einführung der Schul-Cloud',
			content: 'Um auch nächsten Jahrzehnt des 21. Jahrhunderts Bildungsmäßig spitze aufgestellt zu sein nutzen wir ab sofort die Schul-Cloud. Diese ermöglicht es unter anderem sich mit den bestehenden moodle Accounts anzumelden, Office zu nutzen und auf Bildungsangebote zuzugreifen. Ebenfalls ist es möglich aktualisierte Stundenpläne und Aufgaben einzusehen.',
			createdAt: 12345681,
			url: '#'
		}];

		return (
			<LayoutBackend className="route-dashboard">
				<SectionTitle title="Dashboard" location={this.props.location.query.l || 'school'} />
				<SectionTasks location={this.props.location.query.l || 'school'} />
				<SectionControls dashboard="true" />
				<SectionTimetable weekday="Donnerstag" />
				<SectionMessages />
				<SectionTools buttons={tools} />
				<SectionNews articles={articles} />
			</LayoutBackend>
		);
	}

}

export default Dashboard;
