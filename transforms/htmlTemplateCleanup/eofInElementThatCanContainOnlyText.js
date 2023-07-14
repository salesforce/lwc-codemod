/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const closeElement = (node, errorsMap) => {
  const { endOffset, startTag } = node.sourceCodeLocation ?? {}

  if (endOffset && errorsMap.has(endOffset) && startTag) {
    const tagLength = startTag.endOffset - startTag.startOffset
    const errorLocation = errorsMap.get(endOffset)
    // Create an end tag using the error location to close the element
    node.sourceCodeLocation.endTag = {
      ...errorLocation,
      endOffset: errorLocation.startOffset + tagLength
    }
  }
}

export const fixEofInElementThatCanContainOnlyText = ({ ast, file, parse5Errors }, result) => {
  const filteredErrors = parse5Errors
    .filter(({ code }) => code === 'eof-in-element-that-can-contain-only-text')
    .map(({ code, ...location }) => [location.endOffset, location])

  const errorsMap = new Map(filteredErrors)
  if (errorsMap.size) {
    walkParse5Ast(ast, closeElement, errorsMap)
    result.overwrite[file] = serializeParse5Ast(ast)
  }

  return result
}
