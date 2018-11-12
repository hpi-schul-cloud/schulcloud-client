import React from "react";
import ReactDOM from "react-dom";
import { ClassConfigurationView } from "planner-core-lib/lib/components/views/classConfiguration";
import { setupMaterialComponents } from "../../../helpers/planner";

class View extends React.Component {
  redirectToAddTemplate = (subjectId, classLevelId) => {
    window.location.pathname = `/planner/topicTemplates/new?subjectId=${subjectId}&classLevelId=${classLevelId}`;
  };
  redirectToEditTemplate = templateId => {
    window.location.pathname = `/planner/topicTemplates/${templateId}`;
  };
  redirectToEditInstance = instanceId => {
    window.location.pathname = `/planner/topicInstances/${instanceId}`;
  };
  handleDeleteTemplate = templateId => {};
  handleSaveClassIntances = classInstances => {};

  render() {
    return (
      <ClassConfigurationView
        schoolYearData={this.props.schoolYearData}
        eventData={this.props.eventData}
        allClassTopics={this.props.allClassTopics}
        allTopicTemplates={this.props.allTopicTemplates}
        onAddTemplate={this.redirectToAddTemplate}
        onEditTemplate={this.redirectToEditTemplate}
        onDeleteTemplate={this.handleDeleteTemplate}
        onEditInstance={this.redirectToEditInstance}
        onSaveClassInstances={this.handleSaveClassIntances}
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
    schoolYearData={data.schoolyeardata}
    eventData={data.eventdata}
    allClassTopics={data.allclasstopics}
    allTopicTemplates={data.alltopictemplates}
  />,
  $reactRoot[0]
);
