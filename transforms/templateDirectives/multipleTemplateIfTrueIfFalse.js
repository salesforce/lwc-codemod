import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const isIfTrueIfFalseAttr = (attr) => attr.name === 'if:true' || attr.name === 'if:false'

const removeInvalidIfTrueIfFalseAttributes = (node, ctx) => {
    if (node.attrs?.some(isIfTrueIfFalseAttr)) {
        // In LWC templates only the first if:true/if:false is processed
        // Keep the first occurrence of if:true/if:false and discard the rest
        const idx = node.attrs.findIndex(isIfTrueIfFalseAttr)
        node.attrs = node.attrs.reduce((acc, curr, index) => {
            if (!isIfTrueIfFalseAttr(curr) || index === idx) {
                acc.push(curr)
            }
            return acc
        }, [])
        
        ctx.modified = true
    }
}

export const multipleTemplateIfTrueIfFalse = async ({ templates }) => {
    const result = {
        overwrite: {},
        delete: [],
    }

    templates.forEach(({ ast, file }) => {
        const ctx = { modified: false }
        walkParse5Ast(ast, removeInvalidIfTrueIfFalseAttributes, ctx)
        if (ctx.modified) {
            result.overwrite[file] = serializeParse5Ast(ast)
        }
    })

    return result
}
