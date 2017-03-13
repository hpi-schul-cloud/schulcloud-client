import LayoutBase from '../../base/containers/layout';
import SectionTitle from '../../base/components/title';  /* only for base */
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import SectionSchool from '../containers/school';
import SectionCourses from '../containers/courses';
import SectionClasses from '../containers/classes';
import SectionTeachers from '../containers/teachers';
import SectionStudents from '../containers/students';
import SectionNews from '../containers/news';

require('../styles/administration.scss');

class Administration extends React.Component {

	constructor(props) {
		super(props);
		Tabs.setUseDefaultStyles(false);
	}

	render() {
		return (
			<LayoutBase className="route-administration">
				<SectionTitle title="Administration" />
				<SectionSchool {...this.props} />
				<Tabs>
					<TabList
						className="nav nav-tabs"
						activeTabClassName="active"
						disabledTabClassName="disabled">
						<Tab className="nav-item"><a className="nav-link">Kurse</a></Tab>
						<Tab className="nav-item"><a className="nav-link">Klassen</a></Tab>
						<Tab className="nav-item"><a className="nav-link">Lehrer</a></Tab>
						<Tab className="nav-item"><a className="nav-link">Schüler</a></Tab>
					</TabList>
					<TabPanel><SectionCourses {...this.props} /></TabPanel>
					<TabPanel><SectionClasses {...this.props} /></TabPanel>
					<TabPanel><SectionTeachers {...this.props} /></TabPanel>
					<TabPanel><SectionStudents {...this.props} /></TabPanel>
				</Tabs>
                <SectionNews {...this.props} />
			</LayoutBase>

		);
	}

}

export default Administration;
