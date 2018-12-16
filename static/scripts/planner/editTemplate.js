import "@babel/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import TopicTemplateView from "planner-core-lib/lib/components/views/topicTemplate";
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
      url: `/planner/topicTemplates/${this.props.id}`,
      data: formValues,
      success: () => {
        window.location.pathname = "/planner/myClasses";
      }
    });
  };
  onDelete = () => {
    $.ajax({
      type: "DELETE",
      url: `/planner/topicTemplates/${this.props.id}`,
      success: () => {
        window.location.pathname = "/planner/myClasses";
      }
    });
  };
  onFileAdd = data => {
    handleFileAdd(data, "users/0000d231816abba584714c9e/");
  };
  /**
   * Render the list items.
   */
  render() {
    return (
      <TopicTemplateView
        valueOptions={this.props.valueOptions}
        initialValues={this.props.initialValues}
        mode="EDIT"
        onSave={this.onSave}
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
  <View
    initialValues={data.initialvalues}
    valueOptions={data.valueoptions}
    id={data.id}
  />,
  $reactRoot[0]
);
