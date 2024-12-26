import { date, PropSchema, serializable } from "serializr"
import type { DecoratorSchema } from "class-validator-jsonschema/build/decorators"
import {
  ClassConstructor,
  isArray,
  isClass,
  isFunction,
  isObject,
  isPrimitiveProducer,
  isString,
  PrimitiveProducer
} from "@3fv/guard"
import { ClassConstructorProducer } from "../utils"
import { match } from "ts-pattern"
import { asOption } from "@3fv/prelude-ts"
import { getLogger } from "@3fv/logger-proxy"
import ReflectConstants from "./ReflectConstants"

//import { decorateWithNodeContext } from "./decorateWithNodeContext"
// import { ModelProperty } from "./ModelProperty"
import type { GenericDecoratorContext } from "./context/GenericDecoratorContext"

import { pick } from "lodash"
import { isPropSchema } from "./helpers"
import { TARGET_ATTRIBUTES_KEY, TargetAttributes } from "./TargetAttributes"
import { decorateWithNodeContext } from "./decorateWithNodeContext"
import { ModelProperty } from "./ModelProperty"

const log = getLogger(__filename)
const { info, debug, warn, error } = log

export type AttributeSerializableConfig = (() => PropSchema) | PropSchema
export type AttributeValidatorConfig = DecoratorSchema

export interface AttributeConfig {
  serial: AttributeSerializableConfig
  validator: AttributeValidatorConfig
  decorators?: PropertyDecorator[]
}

export type AttributeOptions = Partial<AttributeConfig>

export type PrimitiveAttributeType = {
  isPrimitive: boolean
  type?: ClassConstructor<any> | PrimitiveProducer
  isArray?: boolean
}

export interface ClassOrPrimitiveAttributeType {
  isPrimitive?: boolean
  type: ClassConstructor<any> | PrimitiveProducer
  isArray?: boolean
}

export interface EnumAttributeType {
  enum: Record<string, string | number> | readonly string[]
  enumName: string
  isArray?: boolean
  isPrimitive?: boolean
  type?: ClassConstructor<any> | PrimitiveProducer
}

export type AttributeType =
  | EnumAttributeType
  | PrimitiveAttributeType
  | ClassOrPrimitiveAttributeType

export type AttributeTypeProducer = () => AttributeType

export function isAttributeEnumType(o: any): boolean {
  return !!o && isObject(o.enum) && isString(o.enumName)
}

export function isAttributeType(o: any): o is AttributeType {
  return (
    !!o &&
    (isAttributeEnumType(o) || isClass(o.type) || isPrimitiveProducer(o.type))
  )
}

export function inferAttributeType(
  typeArg:
    | ClassConstructor<any>
    | PrimitiveProducer
    | [ctor: ClassConstructor<any>]
    | [primitive: PrimitiveProducer]
) {
  const type: AttributeType = match(typeArg)
    .when(
      isArray,
      (
        typeArg: [ctor: ClassConstructor<any>] | [primitive: PrimitiveProducer]
      ) =>
        asOption(typeArg)
          .map(
            ([type]: [type: PrimitiveProducer | ClassConstructor<any>]) => type
          )
          .map(type => ({
            isArray: true,
            isPrimitive: isPrimitiveProducer(type),
            type
          }))
          .get()
    )
    .otherwise((type: ClassConstructor<any> | PrimitiveProducer) => ({
      isArray: false,
      isPrimitive: isPrimitiveProducer(type),
      type
    }))

  debug(`Inferred type`, type, `from`, typeArg)
  return type
}

export function toSerialAttribute(
  { Serializers }: GenericDecoratorContext,
  type: AttributeType
): () => PropSchema {
  const isEnum = isAttributeEnumType(type)
  return () =>
    type.isArray
      ? Serializers.list(
          type.isPrimitive || isEnum
            ? Serializers.primitive()
            : type.type === Date
            ? date()
            : Serializers.object(type.type as ClassConstructor<any>)
        )
      : type.isPrimitive || isEnum
      ? Serializers.primitive()
      : type.type === Date
      ? date()
      : Serializers.object(type.type as ClassConstructor<any>)
}

export type AttributeArg = AttributeOptions | PropSchema | (() => PropSchema)

const defaultAttributeOptions = () =>
  ({
    serial: null,
    swagger: {},
    validator: {},
    decorators: []
  } as AttributeConfig)

/**
 * Entity config keys
 */
const attributeConfigKeys = Object.keys(defaultAttributeOptions())

export function inferAttributeTypeAndConfig<
  Config extends AttributeConfig,
  Options extends Partial<Config>,
  OptionsGuard extends (o: any) => o is Options,
  ConfigDefaults extends () => Config
>(
  optsOrType:
    | ClassConstructor<any>
    | ClassConstructorProducer
    | PrimitiveProducer
    | [ctor: ClassConstructor<any>]
    | [primitive: PrimitiveProducer]
    | Options
    | AttributeTypeProducer
    | AttributeType,
  overrideOptions: Options,
  target: Function | object,
  propertyKey: string | symbol,
  optionsGuard: OptionsGuard,
  configDefaults: ConfigDefaults
): {
  config: Config
  type: AttributeType
  isTypeProvided: boolean
} {
  const isTypeProvided =
    !!optsOrType &&
    !isAttributeOptions(optsOrType) &&
    (isAttributeType(optsOrType) ||
      isClass(optsOrType) ||
      isFunction(optsOrType)) //!isFunction(optsOrType)

  const providedType: AttributeType =
    !isTypeProvided || optionsGuard(optsOrType)
      ? null
      : asOption(optsOrType)
          .map(it =>
            !isClass(it) && !isPrimitiveProducer(it) && isFunction(it)
              ? it()
              : it
          )
          .map(it => (isAttributeType(it) ? it : inferAttributeType(it)))
          .getOrNull()
  //
  // isAttributeType(optsOrType)
  //   ? optsOrType
  //   : inferAttributeType(optsOrType)

  let config: Config = {
    ...configDefaults()
  }

  Array(optsOrType, overrideOptions)
    .filter(optionsGuard)
    .forEach(opts => {
      config = {
        ...config,
        ...opts
      }
    })

  const type = asOption(providedType).getOrCall(() => {
    const reflectedType = Reflect.getMetadata(
      ReflectConstants.DesignType,
      target,
      propertyKey
    )

    return inferAttributeType(reflectedType)
  })

  return { isTypeProvided, type, config }
}

/**
 * Type guard for entity attributes
 *
 * @param o
 */
export function isAttributeOptions(o: any): o is AttributeOptions {
  return !!o && Object.keys(o).some(k => attributeConfigKeys.includes(k))
}

export function Attribute(overrideOptions?: AttributeOptions)
export function Attribute(
  type:
    | ClassConstructorProducer
    | ClassConstructor<any>
    | PrimitiveProducer
    | [ctor: ClassConstructor<any>]
    | [primitive: PrimitiveProducer]
    | AttributeType
    | AttributeTypeProducer,
  overrideOptions?: AttributeOptions
)
export function Attribute(
  optsOrType?:
    | ClassConstructor<any>
    | ClassConstructorProducer
    | PrimitiveProducer
    | [ctor: ClassConstructor<any>]
    | [primitive: PrimitiveProducer]
    | AttributeOptions
    | AttributeTypeProducer
    | AttributeType,
  overrideOptions?: AttributeOptions
) {
  return (target: Function | object, propertyKey: string | symbol) => {
    const { type, config } = inferAttributeTypeAndConfig(
        optsOrType,
        overrideOptions,
        target,
        propertyKey,
        isAttributeOptions,
        defaultAttributeOptions
      ),
      attributes = TargetAttributes.getTarget(
        (target as any)?.constructor ?? target as ClassConstructor<any>
      )
  
  
    // SET THE ATTRIBUTE TYPE ON THE TARGET CONTAINER
    attributes.setAttribute(propertyKey, type)

    return decorateWithNodeContext(
      context => {
        // ITERATE OVER CONFIG AND FILL IN THE BLANKS
        // for (const [key, value] of Object.entries(config) as Array<
        //   [key: keyof AttributeConfig, value: any]
        // >) {
        //   if (!value) {
        //     asOption(
        //       match(key)
        //         .with("swagger", toSwaggerSchema(context, type))
        //         .otherwise(() => null) as
        //         | null
        //         | AttributeSwaggerConfig
        //         | AttributeValidatorConfig
        //         | AttributeSerializableConfig
        //     ).tap(decoratorConfig => {
        //       config[key] = decoratorConfig as any
        //     })
        //   }
        // }

        return ModelProperty(config.validator ?? {})
      },
      context => {
        const propDef = isPropSchema(config.serial)
          ? config.serial
          : isFunction(config.serial)
          ? config.serial()
          : !!config.serial
          ? config.serial
          : toSerialAttribute(context, type)()
        return [serializable(propDef), ...(config.decorators ?? [])]
      }
    )(target, propertyKey)
  }
}
//
// export function Attribute(
//   optsOrSchemaDefFactory:
//     | Partial<AttributeConfig>
//     | PropSchema
//     | (() => PropSchema) = {},
//     overrideOptions: Partial<AttributeConfig> = {}
// ) {
//   let opts: AttributeConfig
//   if (isFunction(optsOrSchemaDefFactory) || isPropSchema(optsOrSchemaDefFactory)) {
//     opts = {
//       ...defaultAttributeOptions(),
//       serial: optsOrSchemaDefFactory,
//       ...overrideOptions
//     }
//   } else {
//     opts = {
//       ...defaultAttributeOptions(),
//       ...optsOrSchemaDefFactory,
//       ...overrideOptions
//     }
//   }
//   return Serializable(
//     isFunction(opts.serial)
//       ? opts.serial()
//       : opts.serial,
//     ModelProperty(
//       opts.swagger,
//       opts.validator,
//       ...(opts.decorators ?? [])
//     )
//   )
// }
