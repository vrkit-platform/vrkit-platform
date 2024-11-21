import { action } from "mobx"
import { applyDecorators, Bind } from "vrkit-shared/decorators"

export const BindAction = () => applyDecorators(Bind, action)

export default BindAction