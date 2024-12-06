import { getLogger } from "@3fv/logger-proxy"
import type { SxProps } from "@mui/material"
import { Box, FormHelperText, Theme } from "@mui/material"

import { DashboardConfig } from "vrkit-models"
import {
  child,
  flexAlign, FlexAuto,
  FlexRow,
  rem
} from "vrkit-shared-ui/styles"

import { createValidator } from "class-validator-formik"
import type { FormikBag, FormikConfig } from "formik"
import { FormikContextType, FormikProps, withFormik } from "formik"
import { first, isEmpty } from "lodash"
import React, { HTMLAttributes, useEffect, useMemo, useRef } from "react"
import { useIsMounted } from "usehooks-ts"
import { useAppDispatch } from "../../../services/store"
import { appTextFieldClasses, AppTextFieldFormik } from "../../app-text-field"
import { FormActionFooterDefault, FormContainer, FormContent, FormRow } from "../../form"
import { get } from "lodash/fp"
// import { useActionContainer } from "../../../../hooks"
import { actionFromTemplate, attributesEqual, isEqual } from "vrkit-shared"
import { useModelEditorContext } from "../../model-editor-context"
import { bind, cloneInstanceOf, propEqualTo } from "vrkit-shared/utils"
// import { attributesEqual } from "vrkit-shared"
import { useActionContainer } from "../../../hooks"
import { Alert } from "../../../services/alerts"
import AppBreadcrumbs from "../../app-breadcrumbs"
import { FlexRowBox } from "vrkit-shared-ui"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

const classPrefix = "DashboardEditForm"

export type DashboardEditFormView = "dialog" | "inline"

type DashboardEditInnerFormProps = {
  dashboard: DashboardConfig
  handleSubmitRef: React.MutableRefObject<any>
  onSubmit: FormikConfig<DashboardConfig>["onSubmit"]
}

/**
 * Project edit form inner form
 */
const DashboardEditInnerForm = withFormik<DashboardEditInnerFormProps, DashboardConfig>({
  mapPropsToValues: get("dashboard"),
  validate: () => ({}),// createValidator(DashboardConfig as any),
  enableReinitialize: true,
  displayName: "DashboardEditInnerFormik",
  handleSubmit: (values: DashboardConfig, formikBag: FormikBag<DashboardEditInnerFormProps, DashboardConfig>) =>
    formikBag.props.onSubmit(values, formikBag)
})(function DashboardEditInnerForm(props: DashboardEditInnerFormProps & FormikProps<DashboardConfig>) {
  const {
      errors,
      handleBlur,
      handleChange,
      handleSubmit,
      isSubmitting,
      initialValues,
      status = {},
      touched,
      values,
      setFieldValue,
      resetForm,
      dashboard,
      handleSubmitRef
    } = props,
    { updateMutatingModel, resetMutatingModels, isMutatingModelNew, mutatingModels } =
      useModelEditorContext<DashboardConfig>(),
    model = first(mutatingModels)

  useEffect(() => {
    const updatedModel = cloneInstanceOf(DashboardConfig, model, values)
    if (
      !isEqual(updatedModel, model) &&
      !attributesEqual(updatedModel, model, DashboardConfig)
      // isModelSameOrUpdated(updatedModel, model)
    ) {
      updateMutatingModel(updatedModel)
    }
  }, [model, values])

  handleSubmitRef.current = handleSubmit

  // useEffect(() => {
  //   if (
  //       !touched.name &&
  //       isMutatingModelNew(values.id) &&
  //       isNotEmpty(values.name)
  //   ) {
  //     const { name } = values,
  //         newCode = asOption(acronym(name))
  //             .filter(isNotEmpty)
  //             .getOrCall(() => name.substring(0, Math.min(name.length,
  // 4)))  info("Generated project code ", newCode, "from name", name)
  // setImmediate(() => { setFieldValue("code", newCode, false) }) } },
  // [isMutatingModelNew, touched, values.name])

  return (
    <FormContainer
      noValidate
      onSubmit={handleSubmit}
    >
      <FormContent>
        <FormRow key="form-row-1">
          <AppTextFieldFormik<DashboardConfig>
            sx={{
              ...FlexRow,
              [child(appTextFieldClasses.input)]: {
                maxWidth: rem(6),
                ["& input"]: {
                  textTransform: "uppercase"
                }
              }
            }}
            selectOnFocus
            name="name"
            placeholder="My Dash"
          />
        </FormRow>
        <FormRow key="form-row-2">
          <AppTextFieldFormik<DashboardConfig>
            flex
            selectOnFocus
            autoFocus
            name="description"
            placeholder="I made it"
          />
        </FormRow>

        {/* ERRORS */}
        <FormRow key="errors">
          {status.errorMessage && (
            <Box sx={{ mt: 3 }}>
              <FormHelperText error>{status.errorMessage}</FormHelperText>
            </Box>
          )}
        </FormRow>
      </FormContent>

      <FormActionFooterDefault<DashboardConfig>
        item={dashboard}
        negativeLabel={isEmpty(dashboard.id) ? "Cancel" : "Revert"}
        negativeHandler={() => {
          resetMutatingModels([dashboard.id])
          resetForm()
        }}
        positiveLabel={isEmpty(dashboard.id) ? "Create" : "Save"}
      />
    </FormContainer>
  )
})

/**
 * Project edit form props
 */
export interface DashboardEditFormProps extends HTMLAttributes<HTMLDivElement> {
  sx?: SxProps<Theme>

  view?: DashboardEditFormView
}

/**
 * Actual form
 *
 * @param {DashboardEditFormProps} props
 * @returns {JSX.Element}
 * @constructor
 */
export function DashboardEditForm(props: DashboardEditFormProps) {
  const isMounted = useIsMounted(),
    { view = "inline", ...other } = props,
    ctx = useModelEditorContext<DashboardConfig>(),
    { mutatingModels, models, setMutatingModel, resetMutatingModels } = ctx,
    mutatingDash = first(mutatingModels),
    sourceDash = models.find(propEqualTo("id", mutatingDash?.id)) ?? mutatingDash,
    dash = useMemo(() => DashboardConfig.create(sourceDash), [sourceDash?.id]),
    handleSubmitRef = useRef<Function>(),
    dispatch = useAppDispatch(),
    onReset = useMemo(() => bind(resetMutatingModels, null, [mutatingDash?.id]), [mutatingDash?.id]),
    onSubmit = Alert.usePromise(
      async (values: DashboardConfig, { setErrors, setStatus, setSubmitting }: FormikContextType<DashboardConfig>) => {
        // DERIVE VALID PROJECT OBJECT
        const pendingDash = DashboardConfig.create(values)

        //
        // try {
        //   // DISPATCH THE SAVE ACTION
        //   const savedProject = await dispatch(
        //     saveProject(pendingProject)
        //   ).unwrap()
        //
        //   if (isMounted()) {
        //     setStatus({ success: true })
        //     setSubmitting(false)
        //   }
        //
        //   onReset()
        //   return savedProject
        // } catch (err) {
        //   error(err)
        //   if (isMounted()) {
        //     setStatus({ success: false, errorMessage: err.message })
        //     setSubmitting(false)
        //   }
        //
        //   return err
        // }
        return pendingDash
      },
      {
        loading: "Saving project...",
        success: ({ result }) => `"Successfully saved project (${result.name})."`,
        error: "Unable to save project."
      },
      [isMounted, onReset]
    ), //   [project, mutatingProject]
    // ),
    saveFn = () => handleSubmitRef?.current?.()

  // useEffect(() => {
  //   if (isDialog) {
  //     dialogContext.set(
  //       DashboardEditDialogContextKeys.formElement,
  //       handleSubmitRef
  //     )
  //   }
  // }, [isDialog, dialogContext, handleSubmitRef])

  useActionContainer(
    classPrefix,
    actionFromTemplate("save", saveFn, {
      name: "Save Project"
    })
  )

  return (
    <DashboardEditInnerForm
      dashboard={dash}
      //project={sourceProject}
      onSubmit={onSubmit}
      handleSubmitRef={handleSubmitRef}
    />
  )
}

export default DashboardEditForm
