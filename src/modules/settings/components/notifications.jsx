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
						<table>
							<tbody>
								<tr>
									<td><Switch on={true} enabled={true}/></td>
									<td>Email</td>
									<td>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</td>
								</tr>
								<tr>
									<td><Switch enabled={true}/></td>
									<td>Messenger</td>
									<td>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</section>
		);
	}
}

export default SectionNotifications;
