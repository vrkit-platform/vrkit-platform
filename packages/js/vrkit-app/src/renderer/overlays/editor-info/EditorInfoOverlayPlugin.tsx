// noinspection HtmlUnknownAttribute

import "vrkit-plugin-sdk"
import Box, { BoxProps } from "@mui/material/Box"

import { getLogger } from "@3fv/logger-proxy"

import { createClassNames } from "vrkit-shared-ui"
import { IPluginComponentProps } from "vrkit-plugin-sdk"
import React from "react"
import { EllipsisBox, FlexColumnBox, FlexRowBox, FlexRowCenterBox } from "vrkit-shared-ui"
import clsx from "clsx"
import { darken, lighten, styled, useTheme } from "@mui/material/styles"
import {
  alpha,
  FillWindow,
  flexAlign,
  FlexAuto,
  FlexColumn,
  FlexRow,
  FlexScaleZero,
  hasCls,
  OverflowHidden,
  padding,
  rem
} from "vrkit-shared-ui"
import { useAppSelector } from "../../services/store"
import { sharedAppSelectors } from "../../services/store/slices/shared-app"
import Paper, { PaperProps } from "@mui/material/Paper"
import Typography, { TypographyProps } from "@mui/material/Typography"
import { isNumber } from "@3fv/guard"
import { OverlayKind } from "vrkit-models"
import { OverlayVREditorPropertyName } from "vrkit-shared"
import { match } from "ts-pattern"
import Icon from "../../components/icon"
import {
  faArrowUpRightAndArrowDownLeftFromCenter,
  faUpDownLeftRight
} from "@awesome.me/kit-79150a3eed/icons/sharp/light"
import { Kbd } from "../../components/keyboard-key"
import { isNotEmpty } from "vrkit-shared"
import { asOption } from "@3fv/prelude-ts"

const log = getLogger(__filename)

const classNamePrefix = "vrEditorOverlayPlugin"

const classNames = createClassNames(classNamePrefix, "root", "row")

const EditorInfoViewRoot = styled(Paper, {
  name: "EditorInfoView",
  label: "EditorInfoView"
})(({ theme }) => {
  return {
    [hasCls(classNames.root)]: {
      borderRadius: rem(1),
      border: `5px solid ${darken(theme.palette.grey.A700, 0.4)}`,
      backgroundColor: alpha(theme.palette.secondary.dark, 0.9),
      overflow: "hidden",
      maxWidth: "100vw",
      color: theme.palette.getContrastText(theme.palette.grey.A700),
      boxShadow:
        "inset 0px 3px 5px -1px rgba(0, 0, 0, 0.2), " +
        "inset 0px 5px 8px 0px rgba(0, 0, 0, 0.14), " +
        "inset 0px 3px 14px 2px rgba(0,0, 0, 0.22)",
      gap: "1rem",
      ...FillWindow,
      ...FlexColumn,
      ...OverflowHidden,
      ...padding("1rem", "1rem"),
      ...flexAlign("stretch", "flex-start")
    }
  }
})

type EditorInfoRowProps = BoxProps & {
  noPadding?: boolean
}

const EditorInfoRow = ({ children, className, sx, noPadding = false, ...other }: EditorInfoRowProps) => {
  const theme = useTheme()
  return (
    <FlexColumnBox
      sx={{
        ...FlexAuto,
        ...flexAlign("stretch", "center"),
        ...(!noPadding && padding("0.5rem", "0.5rem")), // ...flexAlign("center", "stretch"),

        borderRadius: rem(0.5),
        backgroundColor: lighten(theme.palette.secondary.main, 0.3), //border:
        boxShadow: theme.shadows[3], // `5px
        // solid
        // ${darken(theme.palette.grey.A700,
        // 0.4)}`,

        gap: "0.25rem",
        ...sx
      }}
      className={clsx({}, className)}
      {...other}
    >
      {children}
    </FlexColumnBox>
  )
}

interface EditorInfoRowLabelProps extends TypographyProps {}

function EditorInfoRowLabel({ children, className, sx, ...other }: EditorInfoRowLabelProps) {
  const theme = useTheme()
  return (
    <EllipsisBox
      className={clsx(className, {})}
      sx={{
        textAlign: "left",
        fontSize: "0.5rem",
        ...FlexAuto,
        ...sx
      }}
      {...other}
    >
      {children}
    </EllipsisBox>
  )
}

interface EditorInfoRowContentProps extends BoxProps {}

function EditorInfoRowContent({ children, className, sx, ...other }: EditorInfoRowContentProps) {
  const theme = useTheme()
  return (
    <FlexRowBox
      className={clsx(className, {})}
      sx={{
        ...flexAlign("center", "stretch"),
        gap: "1.5rem",
        ...sx
      }}
      {...other}
    >
      {children}
    </FlexRowBox>
  )
}

interface EditorInfoRowContentTextProps extends TypographyProps {}

function EditorInfoRowContentText({ children, className, sx, ...other }: EditorInfoRowContentTextProps) {
  const theme = useTheme()
  return (
    <EllipsisBox
      className={clsx(className, {})}
      sx={{
        fontSize: "1.2rem", // ...flexAlign("stretch", "center"),
        ...sx
      }}
      {...other}
    >
      {children}
    </EllipsisBox>
  )
}

interface EditorInfoRowContentTextAccessoryProps extends BoxProps {}

function EditorInfoRowContentTextAccessory({
  children,
  className,
  sx,
  ...other
}: EditorInfoRowContentTextAccessoryProps) {
  const theme = useTheme()
  return (
    <Box
      className={clsx(className, {})}
      sx={{
        color: alpha(theme.palette.getContrastText(theme.palette.grey.A700), 0.75),
        fontSize: "0.8rem",
        ...flexAlign("stretch", "center"),
        ...FlexAuto,
        ...sx
      }}
      {...other}
    >
      {children}
    </Box>
  )
}

interface EditorInfoViewProps extends PaperProps {}

function EditorInfoView({ className, ...other }: EditorInfoViewProps) {
  const theme = useTheme(),
    selectedProp = useAppSelector(
      sharedAppSelectors.selectEditorSelectedOverlayConfigProp
    ) as OverlayVREditorPropertyName,
    selectedInfo = useAppSelector(sharedAppSelectors.selectEditorSelectedOverlayConfig),
    actions = useAppSelector(sharedAppSelectors.selectOverlayEditorActions)
  //"electronWindowDraggable"
  return (
    <EditorInfoViewRoot
      className={clsx(classNames.root, className)}
      elevation={5}
    >
      <EditorInfoRow>
        <EditorInfoRowLabel>
          SELECTED OVERLAY
          {/*<Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd>*/}
        </EditorInfoRowLabel>
        <EditorInfoRowContent>
          <EditorInfoRowContentText>{selectedInfo.name}</EditorInfoRowContentText>
          <EditorInfoRowContentTextAccessory>
            {(isNumber(selectedInfo.kind) ? OverlayKind[selectedInfo.kind] : selectedInfo.kind) as string}
          </EditorInfoRowContentTextAccessory>
        </EditorInfoRowContent>
      </EditorInfoRow>
      <EditorInfoRow>
        <EditorInfoRowLabel>MODIFYING PROPERTY</EditorInfoRowLabel>
        <EditorInfoRowContent>
          {/*<EditorInfoRowContentText>*/}
          <FlexRowCenterBox
            sx={{
              gap: "0.5rem"
            }}
          >
            {match(selectedProp)
              .when(
                prop => ["x", "y"].includes(selectedProp),
                prop => (
                  <>
                    <Icon
                      fa={true}
                      icon={faUpDownLeftRight}
                    />
                    <Box>{prop}</Box>
                  </>
                )
              )
              .when(
                prop => ["width", "height"].includes(selectedProp),
                prop => (
                  <>
                    <Icon
                      fa={true}
                      icon={faArrowUpRightAndArrowDownLeftFromCenter}
                    />
                    <Box>{prop}</Box>
                  </>
                )
              )
              .run()}
          </FlexRowCenterBox>
        </EditorInfoRowContent>
      </EditorInfoRow>

      <FlexColumnBox
        sx={{
          ...flexAlign("stretch", "stretch"),
          boxShadow: theme.shadows[3]
        }}
      >
        <EditorInfoRow
          noPadding
          sx={{
            ...FlexScaleZero,
            ...FlexColumn,
            ...flexAlign("stretch", "flex-start"),

            boxShadow: "none"
          }}
        >
          {actions.map((action, actionIdx) => (
            <Box
              key={action.id}
              sx={{
                ...FlexAuto,
                ...FlexRow,
                ...flexAlign("center", "stretch"),
                ...padding("0.25rem", "0.5rem"),
                backgroundColor: actionIdx % 2 === 0 ? "transparent" : lighten(theme.palette.secondary.main, 0.1)
              }}
            >
              <Typography
                variant={"body2"}
                fontWeight={"lighter"}
                sx={{ ...FlexScaleZero }}
              >
                {action.description ?? action.name}
              </Typography>
              <FlexColumnBox sx={{}}>
                {asOption(action.accelerators)
                  .filter(isNotEmpty)
                  .orCall(() => asOption(action.defaultAccelerators))
                  .filter(isNotEmpty)
                  .match({
                    None: () => <></>,
                    Some: accels => (
                      <>
                        {accels.map((accel, i) => (
                          <FlexRowBox key={accel}>
                            {accel.split("+").map((key, idx) => (
                              <Kbd
                                className="kbc-button no-container"
                                key={idx}
                              >
                                {key}
                              </Kbd>
                            ))}
                          </FlexRowBox>
                        ))}
                      </>
                    )
                  })}
              </FlexColumnBox>
            </Box>
          ))}
        </EditorInfoRow>
      </FlexColumnBox>
    </EditorInfoViewRoot>
  )
}

function EditorInfoOverlayPlugin(props: IPluginComponentProps) {
  const { client, width, height } = props

  return <EditorInfoView />
}

// async function loadEditorInfoPlugin():
// Promise<React.ComponentType<IPluginComponentProps>> { // await
// createEditorInfoControllerClient() return EditorInfoOverlayPlugin }

export default EditorInfoOverlayPlugin
