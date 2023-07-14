/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { serializeParse5Ast } from '../parse5Utils'

export const fixEndTagWithoutMatchingOpenElement = ({ ast, file, parse5Errors }, result) => {
  const hasEndTagWithoutMatchingOpenElement = parse5Errors.some(
    ({ code }) => code === 'end-tag-without-matching-open-element'
  )
  if (hasEndTagWithoutMatchingOpenElement) {
    // parse5 eliminates the invalid end tags when it produces the AST.
    result.overwrite[file] = serializeParse5Ast(ast)
  }

  return result
}
