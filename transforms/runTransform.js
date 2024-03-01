/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { isDirectory } from './fsUtils.js'
import { observer } from './observer.js'
import fs from 'fs/promises'
import path from 'path'
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

function uniqByAbsPath(filePaths) {
  const set = new Set()
  for (const filePath of filePaths) {
    set.add(path.resolve(filePath))
  }
  return [...set]
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
      // TODO: this is a hacky solution to the problem - it would be better to avoid running duplicate transforms
      // in the first place. But this is a simple solution to the problem of trying to delete the same file twice
      // because one is a relative path and the other is an absolute path.
      for (const file of uniqByAbsPath(result.delete)) {
        await deleteFile(file)
      }
    }
  }

  observer.emit('total', numModified, numErrors)
}
