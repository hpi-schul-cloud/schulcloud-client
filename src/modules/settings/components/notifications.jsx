require('../styles/notifications.scss');

import Switch from '../../core/scripts/react-toggle-switch/switch.min.js';

class SectionNotifications extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<section className="section-notifications">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Benachrichtigungen</h5>
						</div>
					</div>
					<div className="row">
						<div className="col-sm-6 no-padding">
						<table>
							<tbody>
								<tr>
									<td><Switch on={true} enabled={true}/></td>
									<td>E-Mail</td>
									<td>Erhalte Benachrichtigungen per E-Mail.</td>
								</tr>
								<tr>
									<td><Switch enabled={true}/></td>
									<td>Messenger</td>
									<td>Erhalte Benachrichtigungen per Messenger.</td>
								</tr>
							</tbody>
						</table>
					</div>
					</div>
				</div>
			</section>
		);
	}
}

export default SectionNotifications;
