export default async function handler(req, res) {

  const DEVICE_INFO = '7ae7c62385f2067ff94c6361aa1c47ce5c3acfc0bcfb4f521dc8f2183ca08dbb97fa76ba5c81e8194800bc78e639c80fa0b4686649e252f4d08e0460c5edd13ae3e69384bc675234';
  const IMEI = '864993060962348';
  const BASE = 'https://eu.tracksolidpro.com';

  try {
    // Fetch map.js to find the real API endpoint
    const mapJs = await fetch(`${BASE}/resource/js/map.js?v=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': BASE }
    }).then(r => r.text());

    // Extract API URLs from map.js
    const apiMatches = [...mapJs.matchAll(/["'](\/api\/[^"'?]+)["']/g)].map(m => m[1]);
    const urlMatches = [...mapJs.matchAll(/url\s*[:=]\s*["']([^"']+)["']/g)].map(m => m[1]);
    const ajaxMatches = [...mapJs.matchAll(/\$\.(?:ajax|get|post)\s*\(\s*["']([^"']+)["']/g)].map(m => m[1]);
    const fetchMatches = [...mapJs.matchAll(/fetch\s*\(\s*["']([^"']+)["']/g)].map(m => m[1]);

    const allEndpoints = [...new Set([...apiMatches, ...urlMatches, ...ajaxMatches, ...fetchMatches])]
      .filter(u => u.startsWith('/') || u.startsWith('http'));

    // Try each endpoint
    for (const endpoint of allEndpoints) {
      const url = endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`;
      try {
        // Try GET with params
        const fullUrl = `${url}${url.includes('?') ? '&' : '?'}deviceinfo=${DEVICE_INFO}&imei=${IMEI}&ver=2&method=trackDevice_abr`;
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

    // Return map.js analysis for debugging
    return res.status(200).json({
      map_js_size: mapJs.length,
      endpoints_found: allEndpoints.slice(0, 15),
      map_js_sample: mapJs.substring(0, 1000)
    });

  } catch(err) {
    return res.status(200).json({ error: err.message });
  }
}
