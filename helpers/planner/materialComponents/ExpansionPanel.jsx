import React, { Component } from "react";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

class CustomExpansionPanel extends Component {
  state = {
    isExpanded: true
  };

  toggleExpanded = () => {
    this.setState({
      isExpanded: !this.state.isExpanded
    });
  };

  render() {
    const { caption, children } = this.props;
    return (
      <ExpansionPanel
        expanded={this.state.isExpanded}
        onChange={this.toggleExpanded}
      >
        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>{caption}</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>{children}</ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default CustomExpansionPanel;
