"use strict";
/**
 * @fileoverview Disallow inline styles and hex colors outside base uikit folders
 * @author HAI3 Team
 */
/**
 * Check if file is in a base uikit folder (allowed to use inline styles)
 * Allowed locations:
 * - packages/uikit/src/base/ (global base primitives)
 * - screensets/{name}/uikit/base/ (screenset base primitives - rare, needs justification)
 */
function isInBaseUikitFolder(filename) {
    // Global uikit base folder
    if (filename.includes('/uikit/src/base/') || filename.includes('\\uikit\\src\\base\\')) {
        return true;
    }
    // Screenset uikit base folder (pattern: screensets/*/uikit/base/)
    const screensetBasePattern = /[/\\]screensets[/\\][^/\\]+[/\\]uikit[/\\]base[/\\]/;
    if (screensetBasePattern.test(filename)) {
        return true;
    }
    return false;
}
const rule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow inline styles and hex colors outside base uikit folders',
            category: 'Styling',
            recommended: true,
        },
        messages: {
            noInlineStyle: 'Inline style={{}} is forbidden. Use Tailwind classes instead (e.g., className="p-4 bg-background").',
            noHexColor: 'Hex color "{{color}}" is forbidden. Use CSS variable like "hsl(var(--primary))" or Tailwind class.',
        },
        schema: [],
    },
    create(context) {
        const filename = context.getFilename();
        // Allow in base uikit folders (core primitives need direct styling)
        if (isInBaseUikitFolder(filename)) {
            return {};
        }
        return {
            // Detect style={{}} JSX attributes
            'JSXAttribute[name.name="style"][value.type="JSXExpressionContainer"]'(node) {
                context.report({
                    node: node,
                    messageId: 'noInlineStyle',
                });
            },
            // Detect hex color literals
            Literal(node) {
                if (typeof node.value === 'string' &&
                    /^#[0-9a-fA-F]{3,8}$/.test(node.value)) {
                    context.report({
                        node: node,
                        messageId: 'noHexColor',
                        data: { color: node.value },
                    });
                }
            },
        };
    },
};
module.exports = rule;
//# sourceMappingURL=no-inline-styles.js.map