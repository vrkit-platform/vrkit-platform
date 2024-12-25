import { action } from "mobx"
import { applyDecorators, Bind } from "@vrkit-platform/shared/decorators"

export const BindAction = () => applyDecorators(Bind, action)

export default BindAction