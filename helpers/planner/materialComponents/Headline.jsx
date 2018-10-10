import React from "react";
import Typography from "@material-ui/core/Typography";

const Headline = ({ caption }) => {
  return (
    <Typography variant="headline" gutterBottom>
      {caption}
    </Typography>
  );
};

export default Headline;
