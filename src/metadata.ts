type Scalar = null | boolean | string | number

export const MAX_METADATA_SIZE = 8

export class Metadata extends Map<string, Scalar> {
  set(key: string, value: Scalar): this {
    if (this.size === MAX_METADATA_SIZE) {
      throw new Error(
        `Maximum size of Metadata exceeded. Only ${MAX_METADATA_SIZE} key-value pairs may be specified`
      )
    }
    super.set(key, value)
    return this
  }

  toJSON(): object {
    return Object.fromEntries(this.entries())
  }
}
