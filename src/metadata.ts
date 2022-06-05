/**
 * Scalar is the allowable types for Metadata
 */
type Scalar = null | boolean | string | number

export const MAX_METADATA_SIZE = 8

/**
 * Metadata provides a means of associating additional metadata with a
 * Dependency, Manifest, or Snapshot. Metadata are simple key-value pairs.
 *
 * @extends {Map<string, Scalar>}
 */
export class Metadata extends Map<string, Scalar> {
  /**
   * Set a metadata key-value pair. Note that a maximum of 8 metadata key-value
   * pairs may be set.
   *
   * @param {string} key
   * @param {Scalar} value
   * @returns {this}
   */
  set(key: string, value: Scalar): this {
    if (this.size === MAX_METADATA_SIZE) {
      throw new Error(
        `Maximum size of Metadata exceeded. Only ${MAX_METADATA_SIZE} key-value pairs may be specified`
      )
    }
    super.set(key, value)
    return this
  }

  /**
   * Metadata has a custom toJSON serializer
   *
   * @returns {object}
   */
  toJSON(): object {
    return Object.fromEntries(this.entries())
  }
}
