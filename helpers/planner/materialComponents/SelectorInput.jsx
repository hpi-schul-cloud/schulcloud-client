import React from "react";
import Select from "./Select";
import TextField from "./TextField";
import IconButton from "@material-ui/core/IconButton";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from "@material-ui/icons/Clear";

function SelectorInput(props) {
  function removeItem(index) {
    props.onChange([
      ...props.values.slice(0, index),
      ...props.values.slice(index + 1)
    ]);
  }

  function addField() {
    props.onChange([
      ...props.values,
      {
        typeValue: props.typeOptions[0].value,
        timeValue: props.timeOptions[0].value,
        textValue: ""
      }
    ]);
  }

  function changeField(index, newValue) {
    props.onChange([
      ...props.values.slice(0, index),
      {
        ...props.values[index],
        ...newValue
      },
      ...props.values.slice(index + 1)
    ]);
  }

  const { typeOptions, timeOptions, values } = props;
  return (
    <div>
      {values.map((value, index) => (
        <div key={index}>
          <Select
            initialValue={value.typeValue}
            onChange={event =>
              changeField(index, {
                typeValue: event.target.value
              })
            }
            values={typeOptions.map(option => ({
              text: option.text,
              id: option.value
            }))}
          />
          <Select
            initialValue={value.timeValue}
            onChange={event =>
              changeField(index, {
                timeValue: event.target.value
              })
            }
            values={timeOptions.map(option => ({
              text: option.text,
              id: option.value
            }))}
          />
          <TextField
            value={value.textValue}
            onChange={event =>
              changeField(index, { textValue: event.currentTarget.value })
            }
          />
          <IconButton onClick={() => removeItem(index)} aria-label="Clear">
            <ClearIcon />
          </IconButton>
        </div>
      ))}
      <IconButton onClick={addField} aria-label="Add">
        <AddIcon />
      </IconButton>
    </div>
  );
}

export default SelectorInput;
