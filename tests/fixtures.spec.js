/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { jest } from '@jest/globals'
import { testFixtureDir } from './utils/jestUtils.js'
import { main } from '../transforms/index.js'
import { copyDir, getAllFilesInDir } from '../transforms/fsUtils.js'
import path from 'node:path'
import { readdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import { observer } from '../transforms/observer.js'

jest.setTimeout(60000)

describe('fixtures', () => {
  const transforms = readdirSync('./tests/fixtures')
  for (const transform of transforms) {
    describe(transform, () => {
      testFixtureDir(`./tests/fixtures/${transform}`,
        async ({ dirname }) => {
          const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lwc-codemod-'))
          const expectedDir = path.join(path.dirname(dirname), 'expected')
          await fs.mkdir(expectedDir, { recursive: true })
          await copyDir(dirname, tmpDir)

          const logs = { modified: [], deleted: [], errors: [] }
          observer.on('modified', filename => {
            logs.modified.push(path.relative(tmpDir, filename))
          })

          observer.on('deleted', filename => {
            logs.deleted.push(path.relative(tmpDir, filename))
          })

          observer.on('error', (ignoredError, filename) => {
            logs.errors.push(path.relative(tmpDir, filename))
          })

          observer.on('total', (numModified, numErrors) => {
            logs.total = { numModified, numErrors }
          })

          await main(tmpDir, transform)
          observer.removeAllListeners()

          await fs.writeFile(path.join(tmpDir, 'logs.json'), JSON.stringify(logs, null, 2), 'utf8')

          const actualFiles = await getAllFilesInDir(tmpDir, ['.ts', '.js', '.html', '.css', '.scss', '.json'], [])
          const expectedFiles = await getAllFilesInDir(expectedDir, ['.ts', '.js', '.html', '.css', '.scss', '.json'], [])

          const allFiles = new Set([
            ...expectedFiles.map(_ => path.relative(expectedDir, _)),
            ...actualFiles.map(_ => path.relative(tmpDir, _))
          ])

          return Object.fromEntries(await Promise.all([...allFiles].map(async (file) => {
            const expectedFile = path.join(expectedDir, file)
            const actualFile = path.join(tmpDir, file)
            let actualContent = null
            try {
              actualContent = await fs.readFile(actualFile, 'utf8')
            } catch (err) { /* ignore */ }
            return [
              expectedFile,
              actualContent
            ]
          })))
        }
      )
    })
  }
})
