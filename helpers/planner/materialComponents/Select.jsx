import React from "react";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import SCTheme from "./SchulCloudThemeProvider";

const CustomSelect = ({ caption, initialValue, values, onChange }) => {
  return (
    <SCTheme>
      <FormControl>
        <InputLabel htmlFor="age-simple">{caption}</InputLabel>
        <Select
          value={initialValue}
          onChange={onChange}
          inputProps={{
            name: "age",
            id: "age-simple"
          }}
        >
          {values.map(value => (
            <MenuItem key={value.id} value={value.id}>
              {value.text}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </SCTheme>
  );
};

export default CustomSelect;
