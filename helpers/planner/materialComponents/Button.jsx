import React from "react";
import Button from "@material-ui/core/Button";
import SCTheme from "./SchulCloudThemeProvider";

const getVariant = type => {
  return {
    default: "outlined",
    bold: "contained",
    thin: "text"
  }[type];
};

const CustomButton = ({
  caption,
  onClick,
  disabled = false,
  color = "default",
  type = "default",
  size = "medium"
}) => {
  const variant = getVariant(type);

  return (
    <SCTheme>
      <Button
        variant={variant}
        size={size}
        color={color}
        onClick={onClick}
        disabled={disabled}
      >
        {caption}
      </Button>
    </SCTheme>
  );
};
export default CustomButton;
