function generateHexagonsCoordinates(center_x, center_y, radius, side_length) {
    // center_x, center_y are expected in lon, lat (EPSG:4326)
    // radius and side_length are in meters
    const hexVertices = [];
    const s = Number(side_length);
    const sqrt3 = Math.sqrt(3);

    // Maximum distance to consider from center (meters)
    const max_dist = Number(radius) + s;

    // axial/q,r grid extents
    const max_q = Math.ceil(max_dist / (1.5 * s));
    const max_r = Math.ceil(max_dist / (sqrt3 * s));

    // Helper: convert meter offsets (dx east, dy north) to degrees based on center latitude
    function metersToDegrees(dx, dy, latDeg) {
        // Approximate conversions
        const latRad = (latDeg * Math.PI) / 180;
        const metersPerDegLat = 111320; // approximate
        const metersPerDegLon = 111320 * Math.cos(latRad);
        const dLat = dy / metersPerDegLat;
        const dLon = dx / (metersPerDegLon || 1e-9);
        return [dLon, dLat];
    }

    // Iterate axial coordinates q (column), r (row)
    for (let q = -max_q; q <= max_q; q++) {
        for (let r = -max_r; r <= max_r; r++) {
            // Compute hex center in meters relative to origin using "pointy-top" axial coordinates
            // x (east) = s * 3/2 * q
            // y (north) = s * sqrt(3) * (r + q/2)
            const x_m = s * 1.5 * q;
            const y_m = s * sqrt3 * (r + q / 2);

            // distance from origin in meters
            const dist = Math.sqrt(x_m * x_m + y_m * y_m);
            if (dist > max_dist) continue;

            // Generate 6 vertices around center in meters then convert to lon/lat
            const currentHex = [];
            const startAngle = Math.PI / 6; // 30deg for pointy-top
            for (let k = 0; k < 6; k++) {
                const angle = startAngle + k * (Math.PI / 3);
                const vx_m = x_m + s * Math.cos(angle);
                const vy_m = y_m + s * Math.sin(angle);

                const [dLon, dLat] = metersToDegrees(
                    vx_m,
                    vy_m,
                    Number(center_y)
                );
                const lon = Number(center_x) + dLon;
                const lat = Number(center_y) + dLat;
                currentHex.push([
                    parseFloat(lon.toFixed(6)),
                    parseFloat(lat.toFixed(6)),
                ]);
            }

            // Close the ring by repeating the first vertex
            if (currentHex.length) currentHex.push(currentHex[0].slice());

            hexVertices.push(currentHex);
        }
    }

    return hexVertices;
}

/**
 * Enrich a single hexagon polygon (rings) using ArcGIS GeoEnrichment REST API
 * Returns the parsed JSON response.
 * Uses POST with application/x-www-form-urlencoded body.
 *
 * @param {Array<Array<number>>} rings - array of [lon, lat] pairs representing polygon vertices
 * @param {string} token - ArcGIS access token
 * @param {Object} [opts] - optional settings: {country: 'MY', dataCollections: ['KeyFacts']}
 */
async function fetchGeoEnrichmentForHex(rings, token, opts = {}) {
    const endpoint = 'https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/enrich';
    const country = opts.country || 'MY';
    const dataCollections = opts.dataCollections || ['KeyFacts'];

    // Ensure the ring is closed (first point repeated at the end)
    const closed = rings.length > 0 && (rings[0][0] === rings[rings.length - 1][0] && rings[0][1] === rings[rings.length - 1][1])
        ? rings
        : rings.concat([rings[0]]);

    const wkid = opts.wkid || 4326;
    const studyAreas = [
        {
            geometry: {
                rings: [closed],
                spatialReference: { wkid }
            },
            attributes: { id: 'Polygon 1' }
        }
    ];

    const studyAreasOptions = { GeometryType: 'esriGeometryPolygon', SpatialRelationship: 'esriSpatialRelIntersects' };

    const params = new URLSearchParams();
    params.append('StudyAreas', JSON.stringify(studyAreas));
    params.append('StudyAreasOptions', JSON.stringify(studyAreasOptions));
    params.append('useData', JSON.stringify({ sourceCountry: country }));
    params.append('f', 'pjson');
    if (token) params.append('token', token);
    params.append('dataCollections', JSON.stringify(dataCollections));

    // Use axios via shared API helper
    const arcgisApi = require('../api/arcgisApi');
    return arcgisApi.enrichPolygon(closed, token, { country, dataCollections, wkid });
}

/**
 * Extract TOTPOP_CY value from a GeoEnrichment response object.
 * The API response shape may vary; this performs a shallow search for the key name.
 * Returns number or null if not found.
 */
function extractTOTPOP_CY(responseJson) {
    if (!responseJson) return null;

    // Common path: results[0].value.FeatureSet.features[0].attributes.TOTPOP_CY
    try {
        if (responseJson.results && Array.isArray(responseJson.results)) {
            for (const r of responseJson.results) {
                // r.value.FeatureSet.features
                const value = r.value || r;
                if (value && value.FeatureSet && Array.isArray(value.FeatureSet.features) && value.FeatureSet.features.length) {
                    const attr = value.FeatureSet.features[0].attributes || {};
                    if (attr.TOTPOP_CY !== undefined) return attr.TOTPOP_CY;
                }

                // Some outputs use 'value' with attributes directly
                if (value && value.attributes && value.attributes.TOTPOP_CY !== undefined) {
                    return value.attributes.TOTPOP_CY;
                }
            }
        }
    } catch (e) {
        // fall through to generic search
    }

    // Generic traversal to find first key named TOTPOP_CY
    const stack = [responseJson];
    while (stack.length) {
        const node = stack.pop();
        if (node && typeof node === 'object') {
            if (Object.prototype.hasOwnProperty.call(node, 'TOTPOP_CY')) {
                return node.TOTPOP_CY;
            }
            for (const k of Object.keys(node)) {
                const v = node[k];
                if (v && typeof v === 'object') stack.push(v);
            }
        }
    }

    return null;
}

/**
 * Enrich all hexagons sequentially and return an array of TOTPOP_CY values (or null when missing).
 * Options: { token, country, dataCollections, retry = 2, delayMs = 250 }
 */
async function enrichHexagons(hexagonArray, options = {}) {
    const token = options.token;
    const retry = options.retry == null ? 2 : options.retry;
    const delayMs = options.delayMs == null ? 250 : options.delayMs;
    const returnResponses = options.returnResponses || false; // if true, return full response objects
    const maxCount = options.maxCount == null ? hexagonArray.length : Math.max(0, Math.floor(options.maxCount));
    const out = [];

    for (let idx = 0; idx < Math.min(hexagonArray.length, maxCount); idx++) {
        const hex = hexagonArray[idx];
        // Ensure format: array of [lon, lat] pairs
        const rings = hex.map(p => [Number(p[0]), Number(p[1])]);

        let attempt = 0;
        let lastErr = null;
        while (attempt <= retry) {
            try {
                const resp = await fetchGeoEnrichmentForHex(rings, token, { country: options.country, dataCollections: options.dataCollections });
                const pop = extractTOTPOP_CY(resp);
                if (returnResponses) {
                    out.push({ pop, response: resp });
                } else {
                    out.push(pop);
                }
                break;
            } catch (err) {
                lastErr = err;
                attempt++;
                if (attempt > retry) {
                    // give up for this hexagon and push null or object
                    if (returnResponses) out.push({ pop: null, response: null, error: String(lastErr) });
                    else out.push(null);
                } else {
                    // wait before retry
                    await new Promise(r => setTimeout(r, delayMs));
                }
            }
        }
        // Small pause to avoid hitting rate limits
        await new Promise(r => setTimeout(r, delayMs));
    }

    return out;
}


if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        generateHexagonsCoordinates,
        enrichHexagons
    };
}