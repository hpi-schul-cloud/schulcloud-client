require('../styles/privacy.scss');

import Switch from '../../core/scripts/react-toggle-switch/switch.min.js';

class SectionPrivacy extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<section className="section-privacy">
				<div className="container-fluid">
					<div className="row">
						<div className="col-sm-12 no-padding">
							<h5>Benachrichtigungen</h5>
						</div>
					</div>
					<div className="row">
						<div className="col-sm-8 no-padding">
							<table>
								<thead>
									<tr>
										<th></th>
										<th>Meine Klasse</th>
										<th>Mein Status</th>
										<th>Meine Schule</th>
										<th>Alle</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>Badges</td>
										<td><Switch on={true} enabled={true}/></td>
										<td><Switch on={true} enabled={true}/></td>
										<td><Switch on={true} enabled={true}/></td>
										<td><Switch on={true} enabled={true}/></td>
									</tr>
									<tr>
										<td>Mitgliedschaften in AGs</td>
										<td><Switch enabled={true}/></td>
										<td><Switch enabled={true}/></td>
										<td><Switch enabled={true}/></td>
										<td><Switch enabled={true}/></td>
									</tr>
									<tr>
										<td>Handynummer</td>
										<td><Switch enabled={true}/></td>
										<td><Switch enabled={true}/></td>
										<td><Switch enabled={true}/></td>
										<td><Switch enabled={true}/></td>
									</tr>
									<tr>
										<td>Online Status</td>
										<td><Switch on={true} enabled={true}/></td>
										<td><Switch on={true} enabled={true}/></td>
										<td><Switch on={true} enabled={true}/></td>
										<td><Switch on={true} enabled={true}/></td>
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

export default SectionPrivacy;
