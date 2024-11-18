import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react"
import { propEqualTo, propNotIn, removeFirstMutation } from "vrkit-shared/utils"
import { get } from "lodash/fp"
import type { Auditable } from "vrkit-shared/models"
import { first } from "lodash"
import { getLogger } from "@3fv/logger-proxy"
import { isModelUpdated } from "vrkit-shared/models"

const log = getLogger(__filename)
const { debug, trace, info, error, warn } = log

type ModelWithId = Partial<Auditable> & { id: string }

export interface ModelEditorContextValue<T extends ModelWithId> {
  setMutatingModels(mutatingModels: Array<T>): void

  updateMutatingModels(mutatingModels: Array<T>): void

  setMutatingModel(mutatingModel: T): void

  updateMutatingModel(mutatingModel: T): void

  resetMutatingModels(mutatingModelIds: Array<string>): void

  cancelModelMutation(mutatingModelIds: Array<string>): void

  clearMutatingModels(): void

  modelById(id: string): T

  isMutatingModelNew(id: string): boolean

  isModelMutating(id: string): boolean

  readonly mutatingModels: T[]

  readonly mutatingModelIds: string[]

  readonly models: T[]

  readonly mergedMutatingModels: T[]

  readonly Provider: React.Provider<ModelEditorContextValue<T>>
}

export const ModelEditorContext =
  createContext<ModelEditorContextValue<any>>(null)

export function useModelEditorContext<T extends ModelWithId>() {
  return useContext<ModelEditorContextValue<T>>(ModelEditorContext)
}

const equalityProps = Array<keyof ModelWithId>("id", "updatedAt")

type ConflictingModel<T extends ModelWithId> = [persistent: T, mutating: T]

export function useModelEditorContextProvider<T extends ModelWithId>(models: T[]) {
  // TYPED PROVIDER
  const Provider = ModelEditorContext.Provider as React.Provider<
    ModelEditorContextValue<T>
  >

  const // MUTATING MODELS STATE
    [mutatingModels, setMutatingModels] = useState<T[]>([]),
    // HELPER DATA, MUTATING IDS
    mutatingModelIds = useMemo(
      () => mutatingModels.map(get("id")),
      [mutatingModels]
    ),
    isModelMutating = useCallback(
      (id: string) => mutatingModelIds.includes(id),
      [mutatingModels]
    ),
    isMutatingModelNew = useCallback(
      (id: string) => !models.find(propEqualTo("id", id)),
      [models]
    ),
    // MODELS UPDATED IN DB AND DONT MATCH MUTATING
    conflictingModels = models
      .map(model => {
        const mutating = mutatingModels.find(propEqualTo("id", model.id))
        // CHECK IF DB VERSION HAS CHANGED
        return !mutating
          ? null
          : isModelUpdated(model, mutating)
          ? [model, mutating]
          : null
      })
      .filter(Boolean) as ConflictingModel<T>[],
    // UPDATE MUTATING MODELS
    updateMutatingModels = useCallback(
      (newModels: T[]) => {
        const newModelQueue = [...newModels],
          allModels = mutatingModels
            .map(model => {
              const newModel = removeFirstMutation(
                newModelQueue,
                propEqualTo("id", model.id)
              )
              return newModel ?? model
            })

        if (newModelQueue.length) {
          debug(`Can not update models that are not mutating`, newModelQueue)
        }
        setMutatingModels(allModels)
      },
      [mutatingModels]
    )

  // IF CONFLICTS DETECTED, RESET
  useEffect(() => {
    if (!conflictingModels.length) return

    info(`Resolving conflicts`, conflictingModels)
    const persistentModels = conflictingModels.map(first)
    updateMutatingModels(persistentModels)
  }, [conflictingModels])

  const // MERGED DB STATE & EDITING, AWESOME UX
    mergedMutatingModels = useMemo(() => {
      const mutatingModelQueue = [...mutatingModels]
      const mergedModels = [
        ...models.map(model => {
          let mutatingModel = removeFirstMutation(
            mutatingModelQueue,
            propEqualTo("id", model.id)
          )
          return mutatingModel ?? model
        })
      ]
      return [...mutatingModelQueue, ...mergedModels]
    }, [mutatingModels, models]),
    // HANDLE CANCELLATION
    cancelModelMutation = useCallback(
      (ids: string[]) => {
        setMutatingModels(mutatingModels.filter(propNotIn("id", ids)))
      },
      [mutatingModels]
    ),
    // HANDLE RESET/REVERT CHANGES
    resetMutatingModels = useCallback(
      (ids: string[]) => {
        setMutatingModels(
          ids.length === 0
            ? []
            : mutatingModels
                .map(model =>
                  ids.includes(model.id)
                    ? models.find(propEqualTo("id", model.id))
                    : model
                )
                .filter(Boolean)
        )
      },
      [mutatingModels]
    ),
    // GET MODEL BY ID
    modelById = useCallback(
      (id: string) => mergedMutatingModels.find(propEqualTo("id", id)),
      [mergedMutatingModels]
    ),
    // SINGULAR SET (HELPER)
    setMutatingModel = useCallback(
      (model: T) => setMutatingModels([model].filter(Boolean)),
      [setMutatingModels]
    ),
    // SINGULAR UPDATE (HELPER)
    updateMutatingModel = useCallback(
      (model: T) => updateMutatingModels([model].filter(Boolean)),
      [updateMutatingModels]
    ),
    // CLEAR ALL MUTATING MODELS (AND LIKELY SELECTIONS)
    clearMutatingModels = () => {
      setMutatingModels([])
    }

  return {
    mutatingModels,
    mutatingModelIds,
    setMutatingModels,
    updateMutatingModel,
    updateMutatingModels,
    setMutatingModel,
    resetMutatingModels,
    cancelModelMutation,
    clearMutatingModels,
    mergedMutatingModels,
    isMutatingModelNew,
    modelById,
    isModelMutating,
    models,
    Provider
  } as ModelEditorContextValue<T>
}
