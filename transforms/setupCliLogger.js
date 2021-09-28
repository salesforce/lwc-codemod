/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { observer } from './observer.js'

export function setupCliLogger () {
  observer.on('modified', filename => {
    console.log('Modified', filename)
  })

  observer.on('deleted', filename => {
    console.log('Deleted', filename)
  })

  observer.on('error', (error, file) => {
    console.log('Error parsing file, skipping', file, error)
  })

  observer.on('total', (numModified, numErrors) => {
    console.log('Modified', numModified, 'file(s) with', numErrors, 'error(s)')
  })
}
