/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as parse5Module from 'parse5'

const parse5 = parse5Module.default ?? parse5Module

function getAttr (node, name) {
  const attr = node.attrs ? node.attrs.find((attr) => attr.name === name) : null
  return attr && attr.value
}

function setAttr (node, name, value) {
  const attr = node.attrs.find(attr => attr.name === name)
  if (attr) {
    attr.value = value
  } else {
    node.attrs.push({ name, value })
  }
}

function delAttr (node, name) {
  const idx = node.attrs.findIndex(attr => attr.name === name)
  if (typeof idx === 'number' && idx !== -1) {
    node.attrs.splice(idx, 1)
  }
}

function addClass (node, className) {
  const attr = getAttr(node, 'class') || ''
  setAttr(node, 'class', (attr.trim() + ' ' + className).trim())
}

function replaceNode (node, replacement) {
  const parentIdx = node.parentNode.childNodes.indexOf(node)
  node.parentNode.childNodes[parentIdx] = replacement
  replacement.parent = node.parent
}

function walkParse5Ast (ast, onNode) {
  const stack = [ast]
  while (stack.length) {
    const node = stack.shift()

    onNode(node)

    if (node.childNodes && node.childNodes.length) {
      stack.push(...node.childNodes)
    } else if (node.tagName === 'template' && node.content.childNodes && node.content.childNodes.length) {
      stack.push(...node.content.childNodes)
    }
  }
}

export function modifyTemplateHtml (htmlFile, source, ast, associatedCssFileContent, domManualClass, result) {
  let modified = false
  let firstTemplate = true
  const processedSlots = new Set()

  // True if this <slot> needs a <div> wrapper to work properly in light DOM, e.g. because it
  // has event listeners or CSS selectors targeting it
  function needsSlotWrapper (node) {
    if (node.attrs && node.attrs.some(attr => attr.name !== 'name')) { // <slot name="foo"> is okay
      return true
    }
    if (associatedCssFileContent && associatedCssFileContent.includes('slot')) {
      // just sniff the CSS to see if it contains "slot"
      return true
    }
    return false
  }

  let hasDomManual = false
  walkParse5Ast(ast, node => {
    if (node.tagName === 'template' && firstTemplate) {
      firstTemplate = false
      if (getAttr(node, 'lwc:render-mode') !== 'light') {
        modified = true
        setAttr(node, 'lwc:render-mode', 'light')
      }
    } else if (modified && node.tagName === 'slot' && !processedSlots.has(node) && needsSlotWrapper(node)) {
      // replace <slot> with a wrapper: <div class="lwc-slot-wrapper"><slot></slot></div>
      processedSlots.add(node)
      const newNode = {
        namespaceURI: 'http://www.w3.org/1999/xhtml',
        attrs: node.attrs.filter(_ => _.name !== 'name'),
        childNodes: [node],
        nodeName: 'div',
        tagName: 'div'
      }
      addClass(newNode, 'lwc-slot-wrapper')
      replaceNode(node, newNode)
      node.parentNode = newNode
      node.attrs = node.attrs.filter(_ => _.name === 'name')
    } else if (modified && getAttr(node, 'lwc:dom') === 'manual') {
      hasDomManual = true
      delAttr(node, 'lwc:dom')
      if (associatedCssFileContent) { // don't need to add this class if there's no CSS
        addClass(node, domManualClass)
      }
    }
  })

  if (modified) {
    let newSource
    newSource = parse5.serialize(ast)
    // replace the quotes around `foo="{bar}"` which parse5 adds, but the LWC compiler doesn't like
    newSource = newSource.replace(/(\w+)="{([\w.]+)+}"/g, '$1={$2}')

    result.overwrite[htmlFile] = newSource
  }
  return hasDomManual
}
