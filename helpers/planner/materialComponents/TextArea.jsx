import React from "react";
import MaterialTextField from "@material-ui/core/TextField";
import SCTheme from "./SchulCloudThemeProvider";

const TextArea = ({
  label = "",
  placeHolderText = "",
  value = "",
  onChange = () => {}
}) => {
  return (
    <SCTheme>
      <MaterialTextField
        id={label}
        placeholder={placeHolderText}
        label={label}
        value={value}
        onChange={onChange}
        margin="dense"
        multiline={true}
        rows={6}
        rowsMax={20}
      />
    </SCTheme>
  );
};

export default TextArea;
