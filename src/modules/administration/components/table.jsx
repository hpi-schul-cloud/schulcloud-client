require('../styles/table.scss');

class Table extends React.Component {

	constructor(props) {
		super(props);
	}

	headUI() {
		if(!this.props.head) return;
		return (
			<thead>
				<tr>
					{this.props.head.map((cell, cellIndex) => (<th key={cellIndex}>{cell}</th>))}
				</tr>
			</thead>
		);
	}

	bodyUI() {
		if(!this.props.body) return;

		return (
			<tbody>
				{this.props.body.map((cells, cellsIndex) => (
					<tr key={cellsIndex}>
						{cells.map((cell, cellIndex) => (<td key={cellIndex}>{cell}</td>))}
					</tr>
				))}
			</tbody>
		);
	}

	render() {
		const classes = this.props.className || 'table table-hover table-bordered';
		return (
			<table className={classes}>
				{this.headUI()}
				{this.bodyUI()}
			</table>
		);
	}

}

export default Table;
