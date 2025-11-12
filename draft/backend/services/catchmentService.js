const defineHex = require('../utils/defineHexagons');

// Map business categories to settings (sideLength in meters, baseMaxPerKm2, dataCollections etc.)
const CATEGORY_MAP = {
    "Retail": { sideLength: 200, baseMaxPerKm2: 4000, country: 'MY', dataCollections: ['KeyFacts'], retry: 2, delayMs: 300 },
    "FnB": { sideLength: 75, baseMaxPerKm2: 6000, country: 'MY', dataCollections: ['KeyFacts'], retry: 2, delayMs: 300 },
    "Services": { sideLength: 100, baseMaxPerKm2: 3000, country: 'MY', dataCollections: ['KeyFacts'], retry: 2, delayMs: 300 },
    "default": { sideLength: 50, baseMaxPerKm2: 4000, country: 'MY', dataCollections: ['KeyFacts'], retry: 2, delayMs: 300 }
};

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
