import { walkParse5Ast, serializeParse5Ast } from '../parse5Utils'

const isIfTrueIfFalseAttr = (attr) => attr.name === 'if:true' || attr.name === 'if:false'

const removeInvalidIfTrueIfFalseAttributes = (node) => {
    if (node.attrs?.some(isIfTrueIfFalseAttr)) {
        // In LWC templates only the first if:true/if:false is processed
        const validConditionalAttr = node.attrs.find(isIfTrueIfFalseAttr)
        const nonConditionalAttrs = node.attrs.filter(attr => !isIfTrueIfFalseAttr(attr))
        node.attrs = [ ...nonConditionalAttrs, validConditionalAttr ]
    }
}

export const multipleTemplateIfTrueIfFalse = async ({ templates }) => {
    const result = {
        overwrite: {},
        delete: []
    }

    templates.forEach(({ ast, file }) => {
        walkParse5Ast(ast, removeInvalidIfTrueIfFalseAttributes)
        // todo add a check to see if file was actually modified first
        result.overwrite[file] = serializeParse5Ast(ast)
    })

    return result
}
