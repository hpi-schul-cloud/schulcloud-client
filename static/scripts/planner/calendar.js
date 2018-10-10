import React from "react";
import ReactDOM from "react-dom";
import { CalendarView } from "../../vendor/rucola-core-lib";
import { setupMaterialComponents } from "../../../helpers/planner";

class View extends React.Component {
  render() {
    return (
      <CalendarView
        rasterSize={15}
        schoolYear={this.props.schoolYear}
        utcToday={this.props.utcToday}
        classTopicsData={this.props.classTopicsData}
        holidaysData={this.props.holidaysData}
        otherEventsData={this.props.otherEventsData}
        onTopicInstanceClick={id => console.log(id)}
      />
    );
  }
}

/**
 * Render the React root into a <div> of the current page.
 */
setupMaterialComponents();
const $reactRoot = $("#react-root");
const data = $reactRoot.data();

ReactDOM.render(
  <View
    schoolYear={data.schoolyear}
    utcToday={data.utctoday}
    classTopicsData={data.classtopicsdata}
    holidaysData={data.holidaysdata}
    otherEventsData={data.othereventsdata}
  />,
  $reactRoot[0]
);
