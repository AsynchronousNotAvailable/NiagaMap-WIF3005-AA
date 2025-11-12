const axios = require('axios');

/**
 * Enrich a polygon using ArcGIS GeoEnrichment REST API via axios.
 * @param {Array<Array<number>>} rings - closed ring array of [lon, lat]
 * @param {string} token
 * @param {Object} opts - { country, dataCollections, wkid }
 */
async function enrichPolygon(rings, token, opts = {}) {
    const endpoint = 'https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/enrich';
    const country = opts.country || 'MY';
    const dataCollections = opts.dataCollections || ['KeyFacts'];
    const wkid = opts.wkid || 4326;

    const retries = Number.isFinite(opts.retries) ? Math.max(0, opts.retries) : 3;
    const baseDelay = Number.isFinite(opts.retryDelay) ? Math.max(100, opts.retryDelay) : 500; // ms
    const backoffFactor = Number.isFinite(opts.backoffFactor) ? Math.max(1, opts.backoffFactor) : 2;
    const jitter = Boolean(opts.jitter);

    const closed = rings.length > 0 && (rings[0][0] === rings[rings.length - 1][0] && rings[0][1] === rings[rings.length - 1][1])
        ? rings
        : rings.concat([rings[0]]);

    const studyAreas = [
        {
            geometry: { rings: [closed], spatialReference: { wkid } },
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let attempt = 0;
    while (true) {
        try {
            const res = await axios.post(endpoint, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: opts.timeout || 30000
            });

            if (res.status >= 200 && res.status < 300) {
                return res.data;
            }

            // non-2xx: throw to be handled below
            const txt = res.data ? JSON.stringify(res.data) : res.statusText;
            const e = new Error(`GeoEnrichment request failed: ${res.status} ${res.statusText} ${txt}`);
            e.status = res.status;
            throw e;
        } catch (err) {
            attempt++;
            const status = err && err.status ? err.status : (err.response && err.response.status ? err.response.status : null);

            // If it's a client error (4xx) don't retry
            if (status && status >= 400 && status < 500) {
                throw err;
            }

            if (attempt > retries) {
                // give up
                throw err;
            }

            // compute delay with exponential backoff
            let delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
            if (jitter) {
                const jitterMs = Math.floor(Math.random() * Math.min(1000, delay));
                delay = delay + jitterMs;
            }

            // wait and retry
            await sleep(delay);
            // loop to retry
        }
    }
}

module.exports = { enrichPolygon };
