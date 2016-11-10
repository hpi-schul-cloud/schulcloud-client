import {Link} from 'react-router';

import LessonCard from './lessonCard';

require('../styles/table.scss');

const mockWeekdays = {
	Montag: [{
		id: 1,
		lessonTime: '1. +  2.',
		title: 'Mathematik',
		room: 'R 410',
		description: ''
	},
	{
		id: 2,
		lessonTime: '3. +  4.',
		title: 'Erdkunde',
		room: 'R 200',
		description: ''
	},
	{
		id: 3,
		lessonTime: '5. +  6.',
		title: 'Deutsch',
		room: 'R 402',
		description: '',
		disabled: true
	}],
	Dienstag: [{
		id: 1,
		lessonTime: '1. +  2.',
		title: 'Chemie',
		room: 'R 418',
		description: '',
		disabled: true
	},
	{
		id: 2,
		lessonTime: '3. +  4.',
		title: 'Englisch',
		room: 'R 007',
		description: ''
	},
	{
		id: 3,
		lessonTime: '5. +  6.',
		title: 'Sport',
		room: 'Sporthalle',
		description: ''
	}],
	Mittwoch: [{
		id: 1,
		lessonTime: '1. +  2.',
		title: 'Mathematik',
		room: 'R 101',
		description: ''
	},
	{
		id: 2,
		lessonTime: '3. +  4.',
		title: 'Religion',
		room: 'R 606',
		description: ''
	},
	{
		id: 3,
		lessonTime: '5. +  6.',
		title: 'Physik',
		room: 'R 400',
		description: ''
	}],
	Donnerstag: [{
		id: 1,
		lessonTime: '1. +  2.',
		title: 'Mathematik',
		room: 'R 101',
		description: '',
		disabled: true
	},
	{
		id: 2,
		lessonTime: '3. +  4.',
		title: 'Biologie',
		room: 'R 404',
		description: ''
	},
	{
		id: 3,
		lessonTime: '5. +  6.',
		title: 'Sport',
		room: 'Sporthalle',
		description: ''
	},
	{
		id: 4,
		lessonTime: '7. +  8.',
		title: 'Mathe',
		room: 'R 101',
		description: ''
	}],
	Freitag: [{
		id: 1,
		lessonTime: '1. +  2.',
		title: 'Englisch',
		room: 'R 007',
		description: 'Vertretung'
	},
	{
		id: 2,
		lessonTime: '3. +  4.',
		title: 'Deutsch',
		room: 'R 301',
		description: ''
	},
	{
		id: 3,
		lessonTime: '5. +  6.',
		title: 'Mathe',
		room: 'R 101',
		description: ''
	},
	{
		id: 4,
		lessonTime: '7. +  8.',
		title: 'Mathe',
		room: 'R 101',
		description: ''
	},
	{
		id: 5,
		lessonTime: 'Nachmittag',
		title: 'Hortbetreuung',
		room: 'R 999',
		description: ''
	}]
};

class SectionTable extends React.Component {

	constructor(props) {
		super(props);

		this.state = {};
	}


		getCardsUI() {
			var weekdayLessons = mockWeekdays[this.props.weekday];
			return (
				<div>
					<h4>{ this.props.weekday }</h4>
					{ weekdayLessons.map((lesson) => {
							return <LessonCard key={lesson.id} lesson={lesson} />;
						})
					}
				</div>
			);
		}

		getTimelineUI() {
			return (
				<div>
					{[8,9,10,11,12,13,14,15,16,17,18,19].map((time) => {
						return (
							<div className="col-sm-1" key={time}>
								<div className="tick">{time}.00</div>
							</div>
						);
					})}
				</div>
			);
		}

		render() {
			return (
					<div className="container-fluid timetable">
						<div className="row lesson-cards">
							{this.getCardsUI.bind(this)()}
						</div>
						{ (this.props.timeline ?
						<div className="row timeline">
							{this.getTimelineUI.bind(this)()}
						</div>
						: '')}
					</div>
			);
		}
}

export default SectionTable;
