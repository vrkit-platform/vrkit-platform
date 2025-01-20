import Divider,{ DividerProps} from "@mui/material/Divider"
import { styled } from "@mui/material/styles"
import * as React from "react"


// noinspection JSUnusedLocalSymbols
const SettingsDividerRoot = styled(Divider,{
  name: "SettingsDividerRoot"
})(({theme}) => ({
  gridColumnStart: 1,
  gridColumnEnd: 3
}))

export interface SettingsDividerProps extends DividerProps {

}

export function SettingsDivider(props: SettingsDividerProps) {
  return <SettingsDividerRoot {...props}/>
}