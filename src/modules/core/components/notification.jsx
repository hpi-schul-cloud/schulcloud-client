import Alert from 'react-s-alert';
require('react-s-alert/dist/s-alert-default.css');

class Notification extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				<Alert stack={{limit: 1}} />
			</div>
		);
	}
}

export default Notification;
