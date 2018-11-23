import React from "react";
import Typography from "@material-ui/core/Typography";
import Label from "./Label";

const TextField = ({ label = "", text }) => {
  const labelComponent = label ? <Label caption={label} type="small" /> : null;
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        marginTop: label ? "16px" : "0px"
      }}
    >
      {labelComponent}
      <Typography variant="subheading">{text}</Typography>
    </div>
  );
};

export default TextField;
