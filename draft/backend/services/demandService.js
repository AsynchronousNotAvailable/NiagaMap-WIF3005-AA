const defineHex = require('../utils/defineHexagons');

async function fetchPopulationsForHexagons(hexagonArray, token, options = {}) {
    const opts = Object.assign({ country: 'MY', dataCollections: ['KeyFacts'], retry: 2, delayMs: 250, returnResponses: false }, options);
    const responses = await defineHex.enrichHexagons(hexagonArray, { token, country: opts.country, dataCollections: opts.dataCollections, retry: opts.retry, delayMs: opts.delayMs, maxCount: hexagonArray.length, returnResponses: opts.returnResponses });

    let pops_array = [];
    let rawResponses = null;
    if (opts.returnResponses) {
        rawResponses = responses;
        pops_array = responses.map(r => (r && typeof r === 'object') ? r.pop : null);
    } else {
        pops_array = responses;
    }

    return { pops_array, rawResponses };
}

function scaledMaxForRadius(radiusMeters, baseMaxPerKm2 = 4000) {
    const area_m2 = Math.PI * radiusMeters * radiusMeters;
    const area_km2 = area_m2 / 1e6;
    return Math.ceil(baseMaxPerKm2 * area_km2);
}

function calculateDemandScore(pops_array, radiusMeters, baseMaxPerKm2 = 4000) {
    if (!Array.isArray(pops_array)) return [];
    const scaledMax = scaledMaxForRadius(radiusMeters, baseMaxPerKm2);
    const effectiveMax = scaledMax > 0 ? scaledMax : baseMaxPerKm2;
    console.log(`Calculated effectiveMax: ${effectiveMax} for radius: ${radiusMeters}m and baseMaxPerKm2: ${baseMaxPerKm2}`);
    const out = [];
    for (let i = 0; i < pops_array.length; i++) {
        let pop = pops_array[i];
        if (pop == null) { out.push(null); continue; }
        pop = Number(pop);
        if (Number.isNaN(pop)) { out.push(null); continue; }
        if (pop === 0) { out.push(0); continue; }
        const score = 20 * (pop / (pop + effectiveMax));
        out.push(parseFloat(score.toFixed(3)));
    }
    return out;
}

module.exports = { fetchPopulationsForHexagons, calculateDemandScore, scaledMaxForRadius };
