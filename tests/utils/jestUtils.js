/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// via https://github.com/salesforce/lwc/blob/81a90709bb6eb84b41f1cfe29d6afe15c9a97a13/scripts/jest/utils/index.ts
import fs from 'fs'
import path from 'path'
import glob from 'glob'

function toMatchFile (receivedContent, filename) {
  const { snapshotState, expand, utils } = this
  const fileExists = fs.existsSync(filename)
  if (fileExists) {
    const expectedContent = fs.readFileSync(filename, 'utf-8')
    if (receivedContent === null || receivedContent === undefined) {
      // If the file exists but the expected content is undefined or null. If the Jest is
      // running with the update snapshot flag the file should be deleted. Otherwise fails
      // the assertion stating that the file is not expected to be there.
      if (snapshotState._updateSnapshot === 'all') {
        fs.unlinkSync(filename)
        snapshotState.updated++
        return { pass: true, message: () => '' }
      } else {
        snapshotState.unmatched++
        return {
          pass: false,
          message: () => `Fixture output for "${filename}" exists but received no output for it. ` +
            'The fixture has not been deleted. The update flag has to be explicitly ' +
            'passed to write new fixture output.\n' +
            'This is likely because this test is run in a continuous integration (CI) ' +
            'environment in which fixtures are not written by default.\n\n' +
            `Expected: ${utils.printExpected(expectedContent)}`
        }
      }
    }
    if (expectedContent === receivedContent) {
      // If the expected file exists and the expected content is matching with the actual
      // content everything is fine.
      return { pass: true, message: () => '' }
    } else {
      // If the expected file is present but the content is not matching. if Jest is running
      // with the update snapshot flag override the expected content. Otherwise fails the
      // assertion with a diff.
      if (snapshotState._updateSnapshot === 'all') {
        fs.writeFileSync(filename, receivedContent)
        snapshotState.updated++
        return { pass: true, message: () => '' }
      } else {
        snapshotState.unmatched++
        return {
          pass: false,
          message: () => {
            const diffString = utils.diff(expectedContent, receivedContent, {
              expand
            })
            return (`Received content for "${filename}" doesn't match expected content.\n\n` +
              (diffString && diffString.includes('- Expect')
                ? `Difference:\n\n${diffString}`
                : `Expected: ${utils.printExpected(expectedContent)}\n` +
                `Received: ${utils.printReceived(receivedContent)}`))
          }
        }
      }
    }
  } else {
    if (receivedContent === null || receivedContent === undefined) {
      // If expected file doesn't exists and received content is null or undefined everything
      // is fine.
      return { pass: true, message: () => '' }
    }
    // If expected file doesn't exists but got a received content and if the snapshots
    // should be updated, create the new snapshot. Otherwise fails the assertion.
    if (snapshotState._updateSnapshot === 'new' || snapshotState._updateSnapshot === 'all') {
      fs.mkdirSync(path.dirname(filename), { recursive: true })
      fs.writeFileSync(filename, receivedContent)
      snapshotState.added++
      return { pass: true, message: () => '' }
    } else {
      snapshotState.unmatched++
      return {
        pass: false,
        message: () => `Fixture output for "${filename}" has not been written. The update flag has to` +
          'be explicitly passed to write new fixture output.\n' +
          'This is likely because this test is run in a continuous integration (CI) ' +
          'environment in which fixtures are not written by default.\n\n' +
          `Received: ${utils.printReceived(receivedContent)}`
      }
    }
  }
}
// Register jest matcher.
expect.extend({ toMatchFile })

export function testFixtureDir (config, testFn) {
  if (typeof config !== 'object' || config === null) {
    throw new TypeError('Expected first argument to be an object')
  }
  if (typeof testFn !== 'function') {
    throw new TypeError('Expected second argument to be a function')
  }
  const { pattern, root } = config
  if (!pattern || !root) {
    throw new TypeError('Expected a "root" and a "pattern" config to be specified')
  }
  const matches = glob.sync(pattern, {
    cwd: root,
    absolute: true
  })
  for (const dirname of matches) {
    const fixtureName = path.relative(root, dirname)
    test(fixtureName.replace('/input', ''), async () => {
      const outputs = await testFn({
        dirname
      })
      if (typeof outputs !== 'object' || outputs === null) {
        throw new TypeError('Expected test function to returns a object with fixtures outputs')
      }
      for (const [outputName, content] of Object.entries(outputs)) {
        const outputPath = path.resolve(dirname, outputName)
        expect(content).toMatchFile(outputPath)
      }
    })
  }
}
