"use strict";
/**
 * @fileoverview Detect inline React.FC definitions in Screen files
 * @author HAI3 Team
 */
const rule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Detect inline React.FC definitions in Screen files',
            category: 'Screenset Architecture',
            recommended: true,
        },
        messages: {
            inlineComponent: 'Inline component "{{name}}" detected in screen file. ' +
                'Extract to: screens/{screen}/components/{{name}}.tsx (if screen-specific) ' +
                'or screensets/{name}/uikit/{{name}}.tsx (if presentational). ' +
                'Screen files should only orchestrate/compose components.',
        },
        schema: [],
    },
    create(context) {
        const filename = context.getFilename();
        // Only check *Screen.tsx files
        if (!filename.endsWith('Screen.tsx')) {
            return {};
        }
        // Collect all FC declarations and default export name
        const fcDeclarations = [];
        let defaultExportName = null;
        return {
            // Collect FC declarations
            VariableDeclarator(node) {
                const extNode = node;
                if (extNode.id.type !== 'Identifier') {
                    return;
                }
                // Check for React.FC type annotation
                const typeAnnotation = extNode.id.typeAnnotation?.typeAnnotation;
                if (!typeAnnotation) {
                    return;
                }
                // Check if type is React.FC or FC
                const typeName = typeAnnotation.typeName;
                if (!typeName) {
                    return;
                }
                let isReactFC = false;
                // Handle: React.FC (qualified name)
                if (typeName.type === 'TSQualifiedName') {
                    const qualified = typeName;
                    if (qualified.left?.name === 'React' && qualified.right?.name === 'FC') {
                        isReactFC = true;
                    }
                }
                // Handle: FC (imported from React)
                if (typeName.type === 'Identifier' && typeName.name === 'FC') {
                    isReactFC = true;
                }
                if (isReactFC) {
                    fcDeclarations.push({
                        name: extNode.id.name,
                        node,
                    });
                }
            },
            // Track default export identifier
            ExportDefaultDeclaration(node) {
                if (node.declaration && node.declaration.type === 'Identifier') {
                    defaultExportName = node.declaration.name;
                }
            },
            // Report violations after all nodes are visited
            'Program:exit'() {
                for (const decl of fcDeclarations) {
                    // Skip if this is the default export component
                    if (decl.name === defaultExportName) {
                        continue;
                    }
                    context.report({
                        node: decl.node,
                        messageId: 'inlineComponent',
                        data: { name: decl.name },
                    });
                }
            },
        };
    },
};
module.exports = rule;
//# sourceMappingURL=screen-inline-components.js.map