import React from "react";
import ReactDOM from "react-dom";
import TopicInstanceView from "planner-core-lib/lib/components/views/topicInstance";
import { setupMaterialComponents } from "../../../helpers/planner";

class View extends React.Component {
  onSave = formValues => {
    $.ajax({
      type: "PUT",
      url: `/planner/topicInstances/${this.props.id}`,
      data: formValues,
      success: () => {
        window.location = "/planner/myClasses";
      }
    });
  };
  onDelete = () => {
    $.ajax({
      type: "DELETE",
      url: `/planner/topicInstances/${this.props.id}`,
      success: () => {
        window.location = "/planner/myClasses";
      }
    });
  };
  onParentTemplateClick = templateId => {
    window.location = `/planner/topicTemplates/${templateId}`;
  };
  /**
   * Render the list items.
   */
  render() {
    return (
      <TopicInstanceView
        initialValues={this.props.initialValues}
        onSave={this.onSave}
        onTemplateClick={this.onParentTemplateClick}
        onDelete={this.onDelete}
      />
    );
  }
}

/**
 * Render the virtual React DOM into an <div> in the current page.
 */
setupMaterialComponents();
const $reactRoot = $("#react-root");
const data = $reactRoot.data();

ReactDOM.render(
  <View initialValues={data.initialvalues} id={data.id} />,
  $reactRoot[0]
);
