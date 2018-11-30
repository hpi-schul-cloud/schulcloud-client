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
  /**
   * Render the list items.
   */
  onCreate = formValues => {
    $.ajax({
      type: "POST",
      url: "/planner/topicTemplates",
      data: formValues,
      success: () => {
        window.location.pathname = "/planner/myClasses";
      }
    });
  };

  onFileAdd = data => {
    handleFileAdd(data, "users/0000d231816abba584714c9e/");
  };

  render() {
    return (
      <TopicTemplateView
        valueOptions={this.props.valueOptions}
        initialValues={this.props.initialValues}
        mode="NEW"
        onCreate={this.onCreate}
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
  <View initialValues={data.initialvalues} valueOptions={data.valueoptions} />,
  $reactRoot[0]
);
