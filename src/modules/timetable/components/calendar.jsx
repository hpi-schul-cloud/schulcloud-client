import {Link} from 'react-router';

import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';

require('../../../../node_modules/fullcalendar/dist/fullcalendar.min.js');
require('../../../../node_modules/fullcalendar/dist/locale/de.js');

require('../../../../node_modules/fullcalendar/dist/fullcalendar.css');
require('../styles/calendar.scss');

class Calendar extends React.Component {

	constructor(props) {
		super(props);
		this.$calendar = {};
		this.state = {};
	}

	componentDidMount() {
		this.$calendar = $('#calendar');
		this.$calendar.fullCalendar({
			defaultView: this.props.view,
			editable: false,
			events: this.props.events,
			eventRender: (event, element) => {
				if(event.cancelled) {
					element.addClass('fc-event-cancelled');
				}
			},
			header: {
				left: 'title',
				right: 'month,agendaWeek,agendaDay prev,today,next'
			},
			locale: 'de',
			viewRender: (view, element) => {
				location.hash = view.name;
			}
		});

		// overwrite styles
		$('.fc-left > button')
			.wrap('<div class="fc-button-group"></div>');

		$('.fc-button')
			.removeClass('fc-button fc-corner-left fc-corner-right')
			.addClass('btn btn-secondary');

		$('.fc-button-group')
			.removeClass()
			.addClass('btn-group btn-group-sm');
	}

 	componentWillReceiveProps(nextProps) {
		if(this.props.view && nextProps.view !== this.props.view) {
			this.$calendar.fullCalendar('changeView', nextProps.view);
		}
	}

	render() {
		return (
			<LayoutBase className="route-calendar">
				<SectionTitle title="Kalender" />
				<div id="calendar" />
			</LayoutBase>
		);
	}
}

export default Calendar;
