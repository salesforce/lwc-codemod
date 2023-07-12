import * as parse5Module from 'parse5'

const parse5 = parse5Module.default ?? parse5Module

export const walkParse5Ast = (node, cb, ctx) => {
    if (cb) {
        cb(node, ctx)
    }

    const children = node.tagName === 'template' ? node.content.childNodes : node.childNodes
    // Not all parse5 AST nodes have childNodes
    for (const child of children ?? []) {
        walkParse5Ast(child, cb, ctx)
    }
}

export const serializeParse5Ast = (ast) =>
    // replace the quotes around `foo="{bar}"` which parse5 adds, but the LWC compiler doesn't like
    parse5.serialize(ast).replace(/(\w+)="{([\w.]+)+}"/g, '$1={$2}')

export const getAttr = (node, name) => {
    const attr = node.attrs ? node.attrs.find((attr) => attr.name === name) : null
    return attr && attr.value
}

export const setAttr = (node, name, value) => {
    const attr = node.attrs.find((attr) => attr.name === name)
    if (attr) {
        attr.value = value
    } else {
        node.attrs.push({ name, value })
    }
}

export const delAttr = (node, name) => {
    const idx = node.attrs.findIndex((attr) => attr.name === name)
    if (typeof idx === 'number' && idx !== -1) {
        node.attrs.splice(idx, 1)
    }
}

export const addClass = (node, className) => {
    const attr = getAttr(node, 'class') || ''
    setAttr(node, 'class', (attr.trim() + ' ' + className).trim())
}

export const replaceNode = (node, replacement) => {
    const parentIdx = node.parentNode.childNodes.indexOf(node)
    node.parentNode.childNodes[parentIdx] = replacement
    replacement.parent = node.parent
}
