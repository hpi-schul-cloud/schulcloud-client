import React from "react";
import ReactDOM from "react-dom";
import { TopicInstanceView } from "../../vendor/rucola-core-lib";

class View extends React.Component {
  /**
   * Render the list items.
   */
  render() {
    return (
      <TopicInstanceView
        id="id1"
        initialValues={{}}
        onSave={() => {}}
        onDelete={() => {}}
      />
    );
  }
}

/**
 * Render the virtual React DOM into an <div> in the current page.
 */
const reactRoot = document.getElementById("react-root");

ReactDOM.render(<View />, reactRoot);
