export default async function handler(req, res) {

  const DEVICE_INFO = '7ae7c62385f2067ff94c6361aa1c47ce5c3acfc0bcfb4f521dc8f2183ca08dbb97fa76ba5c81e8194800bc78e639c80fa0b4686649e252f4d08e0460c5edd13ae3e69384bc675234';
  const IMEI = '864993060962348';
  const BASE = 'https://eu.tracksolidpro.com';

  try {
    // Fetch mapCollections.js - the real logic file
    const js = await fetch(`${BASE}/resource/map/leaflet/maptestjs/mapCollections.js?v=6`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': BASE }
    }).then(r => r.text());

    // Extract all API endpoints
    const apiMatches = [...js.matchAll(/["'](\/api\/[^"'?#\s]{3,})["']/g)].map(m => m[1]);
    const ajaxMatches = [...js.matchAll(/(?:url|src|href|path)\s*[:=]\s*["']([^"']{3,})["']/g)].map(m => m[1]).filter(u => u.includes('api') || u.includes('share') || u.includes('device') || u.includes('location'));
    const allEndpoints = [...new Set([...apiMatches, ...ajaxMatches])];

    // Try each endpoint with our device params
    for (const endpoint of allEndpoints) {
      const url = `${BASE}${endpoint}`;
      try {
        const fullUrl = `${url}${url.includes('?') ? '&' : '?'}deviceinfo=${DEVICE_INFO}&imei=${IMEI}`;
        const r = await fetch(fullUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': BASE }
        });
        const text = await r.text();
        const latM = text.match(/"?lat[itude]*"?\s*:\s*"?([\d]{1,3}\.[\d]{4,})"?/i);
        const lngM = text.match(/"?l(?:ng|on|ongitude)"?\s*:\s*"?([\d]{1,3}\.[\d]{4,})"?/i);
        if (latM && lngM) {
          return res.redirect(`https://www.google.com/maps?q=${latM[1]},${lngM[1]}&z=17`);
        }
      } catch(e) { continue; }
    }

    // Debug: return what we found in the JS
    return res.status(200).json({
      js_size: js.length,
      endpoints_found: allEndpoints,
      js_sample: js.substring(0, 2000)
    });

  } catch(err) {
    return res.status(200).json({ error: err.message });
  }
}
