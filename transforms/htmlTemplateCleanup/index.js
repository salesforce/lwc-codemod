/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { fixClosingOfElementWithOpenChildElements } from './closingOfElementWithOpenChildElements'
import { fixEndTagWithoutMatchingOpenElement } from './endTagWithoutMatchingOpenElement'
import { fixEofInElementThatCanContainOnlyText } from './eofInElementThatCanContainOnlyText'
import { fixInvalidTemplateAttributes } from './invalidTemplateAttributes.js'
import { fixMultipleIfTrueIfFalseAttributes } from './multipleIfTrueIfFalseAttributes.js'

const transforms = [
  fixInvalidTemplateAttributes,
  fixMultipleIfTrueIfFalseAttributes,
  fixClosingOfElementWithOpenChildElements,
  fixEndTagWithoutMatchingOpenElement,
  fixEofInElementThatCanContainOnlyText
]

export const htmlTemplateCleanup = async ({ templates }) => {
  const result = {
    overwrite: {},
    delete: []
  }

  // TODO: Refactor the template fixes to use a visitor pattern
  templates.forEach((template) => {
    transforms.forEach((transform) => transform(template, result))
  })

  return result
}
