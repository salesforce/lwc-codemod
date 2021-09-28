/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import fs from 'fs/promises'

export async function isFile (fileName) {
  try {
    if ((await fs.lstat(fileName)).isFile()) {
      return true
    }
  } catch (err) { /* does not exist */ }
  return false
}

export async function isDirectory (fileName) {
  try {
    if ((await fs.lstat(fileName)).isDirectory()) {
      return true
    }
  } catch (err) { /* does not exist */ }
  return false
}

export async function getAllFilesInDir (dir, include, exclude) {
  const result = []

  const stack = [dir]
  while (stack.length) {
    const file = stack.shift()
    if (exclude.some(_ => file.includes(_))) {
      continue
    }
    if ((await fs.lstat(file)).isDirectory()) {
      stack.push(...(await fs.readdir(file)).map(_ => path.join(file, _)))
    } else { // file
      if (include.some(_ => file.endsWith(_))) {
        result.push(file)
      }
    }
  }
  return result
}

// via https://stackoverflow.com/a/52562541
export async function copyDir (src, dest) {
  const entries = await fs.readdir(src, { withFileTypes: true })
  await fs.mkdir(dest, {
    recursive: true
  })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}
