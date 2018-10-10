import React, { Component } from "react";

class TopicElement extends Component {
  render() {
    const { height, color, text, width, onClick } = this.props;

    return (
      <div
        style={{
          boxSizing: "border-box",
          height: `${height}px`,
          width: `${width}px`,
          background: color,
          border: "1px solid transparent",
          borderRadius: 5,
          textAlign: "center",
          cursor: onClick ? "pointer" : "inherit",
          display: "inline-block",
          verticalAlign: "top"
        }}
        onClick={onClick}
      >
        <div
          style={{
            userSelect: "none",
            pointerEvents: "none",
            overflowX: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "Roboto",
            fontSize: 13,
            /* height - border width */
            lineHeight: `${height - 2}px`,
            color: "#4a4a4a"
          }}
        >
          {text}
        </div>
      </div>
    );
  }

  static defaultProps = {
    size: "small",
    color: "#FFFFFF"
  };
}

export default TopicElement;
