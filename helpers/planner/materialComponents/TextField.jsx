import React from "react";
import MaterialTextField from "@material-ui/core/TextField";
import SCTheme from "./SchulCloudThemeProvider";

const TextField = ({
  label = "",
  placeHolderText = "",
  value = "",
  onChange = () => {},
  margin = "normal",
  fullWidth = false
}) => {
  return (
    <SCTheme>
      <MaterialTextField
        id={label}
        label={label}
        value={value}
        placeholder={placeHolderText}
        onChange={onChange}
        margin={margin}
        fullWidth={fullWidth}
      />
    </SCTheme>
  );
};

export default TextField;
