/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { modifyComponentJavaScript } from './shadowToLight/modifyComponentJavaScript.js'

export async function shadowToLight (jsFiles, writeFile) {
  await Promise.all(jsFiles.map(async jsFile => {
    await modifyComponentJavaScript(jsFile, writeFile)
  }))
}
