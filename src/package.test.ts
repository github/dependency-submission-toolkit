import { PackageURL } from 'packageurl-js'
import { Package } from './package'

describe('Package', () => {
  it('constructs a from Package URL-formatted string ', () => {
    const purl = 'pkg:npm/%40github/dependency-submission-toolkit@0.1.2'
    const pkg = new Package(purl)

    expect(pkg.namespace()).toBe('@github')
    expect(pkg.name()).toBe('dependency-submission-toolkit')
    expect(pkg.version()).toBe('0.1.2')
  })
  it('constructs a package with from PackageURL object', () => {
    const pkg = new Package(
      new PackageURL(
        'npm',
        '@github',
        'dependency-submission-toolkit',
        '0.1.2',
        null,
        null
      )
    )

    expect(pkg.namespace()).toBe('@github')
    expect(pkg.name()).toBe('dependency-submission-toolkit')
    expect(pkg.version()).toBe('0.1.2')
  })
  it('.matching will match a package with matching aspects', () => {
    const pkg = new Package(
      new PackageURL(
        'npm',
        '@github',
        'dependency-submission-toolkit',
        '0.1.2',
        null,
        null
      )
    )

    expect(pkg.matching({ namespace: '@github' })).toBeTruthy()
    expect(pkg.matching({ namespace: 'buhtig@' })).toBeFalsy()

    expect(pkg.matching({ name: 'dependency-submission-toolkit' })).toBeTruthy()
    expect(pkg.matching({ name: 'foo-bar-baz' })).toBeFalsy()

    expect(pkg.matching({ version: '0.1.2' })).toBeTruthy()
    expect(pkg.matching({ version: '0.1.2' })).toBeTruthy()

    expect(
      pkg.matching({
        namespace: '@github',
        name: 'dependency-submission-toolkit',
        version: '0.1.2'
      })
    ).toBeTruthy()
    expect(
      pkg.matching({
        namespace: 'buhtig@',
        name: 'dependency-submission-toolkit',
        version: '0.1.2'
      })
    ).toBeFalsy()
    expect(
      pkg.matching({
        namespace: '@github',
        name: 'foo-bar-baz',
        version: '0.1.2'
      })
    ).toBeFalsy()
    expect(
      pkg.matching({
        namespace: '@github',
        name: 'dependency-submission-toolkit',
        version: '1.2.3'
      })
    ).toBeFalsy()
  })
})
