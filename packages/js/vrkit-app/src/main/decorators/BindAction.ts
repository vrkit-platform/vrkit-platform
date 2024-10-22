import { action } from "mobx"
import { applyDecorators, Bind } from "vrkit-shared"

export const BindAction = () => applyDecorators(Bind, action)

export default BindAction