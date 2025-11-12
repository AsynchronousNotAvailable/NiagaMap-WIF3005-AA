const catchmentService = require('../services/catchmentService');
const demandService = require('../services/demandService');

/**
 * Controller entrypoint. Given inputs, generate hexagons and compute demand scores.
 * @param {Object} opts - { radius, center_x, center_y, category, token, maxCount, returnResponses }
 * @returns {Object} { hexagons, pops: [], demandScores: [], settings }
 */
async function runCatchment(opts = {}) {
    const { radius, center_x, center_y, category, token, maxCount = null, returnResponses = false } = opts;

    if (![radius, center_x, center_y].every(n => Number.isFinite(Number(n)))) {
        throw new Error('radius, center_x and center_y must be numeric');
    }

    // Generate hexagons and get settings for this category
    const settings = catchmentService.getSettingsForCategory(category);
    const hexagons = catchmentService.generateCatchmentHexagons(center_x, center_y, radius, settings.sideLength);

    // Optionally limit count
    const limitedHexagons = (maxCount && Number.isFinite(Number(maxCount))) ? hexagons.slice(0, Number(maxCount)) : hexagons;

    // Call demand service to fetch populations and compute scores
    const { pops_array, rawResponses } = await demandService.fetchPopulationsForHexagons(limitedHexagons, token, { returnResponses, country: settings.country, dataCollections: settings.dataCollections, retry: settings.retry, delayMs: settings.delayMs });

    const demandScores = demandService.calculateDemandScore(pops_array, radius, settings.baseMaxPerKm2);

    return {
        hexagons: limitedHexagons,
        pops: pops_array,
        numberOfHexagons: limitedHexagons.length,
        rawResponses,
        demandScores,
        settings
    };
}

module.exports = { runCatchment };
