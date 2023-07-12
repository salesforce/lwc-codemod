import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const rootTemplateDirectives = new Set(['lwc:preserve-comments', 'lwc:render-mode'])
const nonRootTemplateDirectives = new Set([
    'for:each',
    'for:index',
    'if:true',
    'if:false',
    'lwc:if',
    'lwc:elseif',
    'lwc:else',
])

const isValidRootTemplateDirective = (attrName) => rootTemplateDirectives.has(attrName)

const isValidNonRootTemplateDirective = (attrName) =>
    nonRootTemplateDirectives.has(attrName) || attrName.startsWith('iterator:')

const removeInvalidAttributes = (node, ctx) => {
    if (node.tagName === 'template') {
        const isValidTemplateDirective = ctx.isRoot
            ? isValidRootTemplateDirective
            : isValidNonRootTemplateDirective
        node.attrs = node.attrs.filter((attr) => isValidTemplateDirective(attr.name))
        ctx.isRoot = false
        ctx.modified = true
    }
}

export const invalidTemplateAttributes = async ({ templates }) => {
    const result = {
        overwrite: {},
        delete: [],
    }

    templates.forEach(({ ast, file }) => {
        const ctx = { isRoot: true, modified: false }
        walkParse5Ast(ast, removeInvalidAttributes, ctx)
        if (ctx.modified) {
            result.overwrite[file] = serializeParse5Ast(ast)
        }
    })

    return result
}
