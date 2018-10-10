import React from "react";
import Typography from "@material-ui/core/Typography";

const typeMap = {
  large: "subheading",
  medium: "body1",
  small: "caption"
};

const Label = ({ caption, className, type = "medium" }) => {
  return (
    <span className={className} style={{ marginBottom: 5 }}>
      <Typography variant={typeMap[type]}>{caption}</Typography>
    </span>
  );
};

export default Label;
