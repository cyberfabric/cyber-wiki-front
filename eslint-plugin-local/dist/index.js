"use strict";
/**
 * ESLint Local Plugin
 * Custom rules for HAI3 screenset architecture enforcement
 */
const noBarrelExportsEventsEffects = require("./rules/no-barrel-exports-events-effects");
const noCoordinatorEffects = require("./rules/no-coordinator-effects");
const noMissingDomainId = require("./rules/no-missing-domain-id");
const domainEventFormat = require("./rules/domain-event-format");
const noInlineStyles = require("./rules/no-inline-styles");
const uikitNoBusinessLogic = require("./rules/uikit-no-business-logic");
const screenInlineComponents = require("./rules/screen-inline-components");
module.exports = {
    rules: {
        'no-barrel-exports-events-effects': noBarrelExportsEventsEffects,
        'no-coordinator-effects': noCoordinatorEffects,
        'no-missing-domain-id': noMissingDomainId,
        'domain-event-format': domainEventFormat,
        'no-inline-styles': noInlineStyles,
        'uikit-no-business-logic': uikitNoBusinessLogic,
        'screen-inline-components': screenInlineComponents,
    },
};
//# sourceMappingURL=index.js.map