import { action } from "mobx"
import { applyDecorators, Bind } from "vrkit-app-common/decorators"

export const BindAction = () => applyDecorators(Bind, action)

export default BindAction