#!/usr/bin/env node
/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { main } from './index.js'
import { setupCliLogger } from './setupCliLogger.js'

const dir = process.argv[process.argv.length - 1]
const transform = process.argv[process.argv.length - 2]

setupCliLogger()

main(dir, transform).catch(err => {
  console.error(err)
  process.exit(1)
})
