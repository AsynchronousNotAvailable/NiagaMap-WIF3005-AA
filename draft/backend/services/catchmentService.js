const defineHex = require('../utils/defineHexagons');
const CATEGORY_MAP = require('../constants/categoryMap');

function getSettingsForCategory(category) {
    return CATEGORY_MAP[category] || CATEGORY_MAP['default'];
}

function generateCatchmentHexagons(center_x, center_y, radius, sideLength) {
    return defineHex.generateHexagonsCoordinates(
        center_x,
        center_y,
        radius,
        sideLength
    );
}

module.exports = { getSettingsForCategory, generateCatchmentHexagons };
