/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { isDirectory } from './fsUtils.js'
import { observer } from './observer.js'
import fs from 'fs/promises'
import { walkComponents } from './walkComponents.js'
import { shadowToLight } from './shadowToLight/index.js'
import { syntheticToNative } from './syntheticToNative/index.js'
import { htmlTemplateCleanup } from './htmlTemplateCleanup/index.js'

const include = ['.js', '.ts']
const exclude = ['__tests__', '.stories.ts']

const transforms = {
  'shadow-to-light': shadowToLight,
  'synthetic-to-native': syntheticToNative,
  'html-template-cleanup': htmlTemplateCleanup
}

export async function runTransform (dir, transformPath) {
  if (!(await isDirectory(dir))) {
    throw new Error(`Directory is a file or does not exist: ${dir}`)
  }

  if (!(transformPath in transforms)) {
    throw new Error(`Unknown transform "${transformPath}". Available transforms: ${Object.keys(transforms).join(', ')}`)
  }
  const transform = transforms[transformPath]

  let numModified = 0
  let numErrors = 0

  async function writeFile (filename, content) {
    observer.emit('modified', filename)
    numModified++
    await fs.writeFile(filename, content, 'utf8')
  }

  async function deleteFile (filename) {
    observer.emit('deleted', filename)
    numModified++
    await fs.rm(filename)
  }

  function onError (error, file) {
    observer.emit('error', error, file)
    numErrors++
  }

  for await (const { component, templates, error, file } of walkComponents({ dir, include, exclude })) {
    if (error) {
      onError(error, file)
    } else {
      const result = await transform({ component, templates })
      for (const [file, content] of Object.entries(result.overwrite)) {
        await writeFile(file, content)
      }
      for (const file of result.delete) {
        await deleteFile(file)
      }
    }
  }

  observer.emit('total', numModified, numErrors)
}
