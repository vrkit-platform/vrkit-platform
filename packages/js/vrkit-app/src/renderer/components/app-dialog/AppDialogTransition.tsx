import React from "react"
import Slide, {SlideProps} from '@mui/material/Slide';

export const AppDialogTransition = React.forwardRef(function Transition(props: SlideProps, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default AppDialogTransition