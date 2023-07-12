import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const rootTemplateDirectives = new Set(['lwc:preserve-comments', 'lwc:render-mode'])
// TODO: need to add iterators to this
const nonRootTemplateDirectives = new Set([
    'for:each',
    'for:index',
    'if:true',
    'if:false',
    'lwc:if',
    'lwc:elseif',
    'lwc:else',
])

const isRootNode = ({ parentNode }) =>
    parentNode?.nodeName === '#document-fragment' && parentNode?.parentNode === undefined

const removeInvalidAttributes = (node) => {
    if (node.tagName === 'template') {
        const validTemplateDirectives = isRootNode(node)
            ? rootTemplateDirectives
            : nonRootTemplateDirectives
        node.attrs = node.attrs.filter((attr) => validTemplateDirectives.has(attr.name))
    }
}

export const invalidTemplateAttributes = async ({ templates }) => {
    const result = {
        overwrite: {},
        delete: [],
    }

    templates.forEach(({ ast, file }) => {
        walkParse5Ast(ast, removeInvalidAttributes)
        // todo add a check to see if file was actually modified first
        result.overwrite[file] = serializeParse5Ast(ast)
    })

    return result
}
