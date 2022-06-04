type Scalar = null | boolean | string | number

export const MaxMetaDataKeys = 8

export type Metadata = Record<string, Scalar>

export function metadataValidSize(metadata: Metadata): boolean {
  if (
    Object.keys(metadata).length >= 1 &&
    Object.keys(metadata).length <= MaxMetaDataKeys
  ) {
    return true
  }
  return false
}
