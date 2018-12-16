import "@babel/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import TopicInstanceView from "planner-core-lib/lib/components/views/topicInstance";
import { setupMaterialComponents } from "../../../helpers/planner";
import {
  handleFileClick,
  handleFileAdd,
  handleFileRemove
} from "../../../helpers/planner/fileHelper";

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
  onFileAdd = data => {
    handleFileAdd(data, "users/0000d231816abba584714c9e/");
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
        onFileClick={handleFileClick}
        onFileAdd={this.onFileAdd}
        onFileRemove={handleFileRemove}
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
