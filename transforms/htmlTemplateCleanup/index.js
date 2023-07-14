/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { fixHtmlTemplateDirectives } from './invalidTemplateAttributes.js'

const transforms = [fixHtmlTemplateDirectives]

export const htmlTemplateCleanup = async ({ templates }) => {
  const result = {
    overwrite: {},
    delete: []
  }

  templates.forEach(template => {
    transforms.forEach(transform => transform(template, result))
  })

  return result
}
