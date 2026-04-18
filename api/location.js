export default async function handler(req, res) {

  const DEVICE_INFO = '7ae7c62385f2067ff94c6361aa1c47ce5c3acfc0bcfb4f521dc8f2183ca08dbb97fa76ba5c81e8194800bc78e639c80fa0b4686649e252f4d08e0460c5edd13ae3e69384bc675234';
  const IMEI = '864993060962348';
  const BASE = 'https://eu.tracksolidpro.com';
  const SHARE_URL = `${BASE}/api/share?ver=2&method=trackDevice_abr&deviceinfo=${DEVICE_INFO}&deviceName=JC261P-62348&deviceIMEI=${IMEI}`;

  try {
    const html = await fetch(SHARE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/91.0',
        'Accept': 'text/html,*/*',
        'Referer': BASE
      }
    }).then(r => r.text());

    // Extract all inline script content
    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');

    // Find API calls in scripts
    const apiMatches = [...scripts.matchAll(/["'`](\/api\/[^"'`\s]{3,})["'`]/g)].map(m => m[1]);
    const ajaxUrls = [...scripts.matchAll(/(?:url|href|src|path|endpoint)\s*[:=]\s*["'`]([^"'`\s]{5,})["'`]/gi)].map(m => m[1]).filter(u => u.includes('/') && !u.includes('.css') && !u.includes('.js') && !u.includes('.png'));
    const fetchUrls = [...scripts.matchAll(/fetch\s*\(["'`]([^"'`]+)["'`]/g)].map(m => m[1]);
    const postUrls = [...scripts.matchAll(/(?:post|POST)\s*\(["'`]([^"'`]+)["'`]/g)].map(m => m[1]);

    const allEndpoints = [...new Set([...apiMatches, ...ajaxUrls, ...fetchUrls, ...postUrls])];

    // Try POST requests (TrackSolid often uses POST)
    for (const endpoint of allEndpoints) {
      const url = endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`;
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': SHARE_URL
          },
          body: `deviceinfo=${encodeURIComponent(DEVICE_INFO)}&imei=${IMEI}&ver=2&method=trackDevice_abr`
        });
        const text = await r.text();
        const latM = text.match(/"?lat[itude]*"?\s*:\s*"?([\d]{1,3}\.[\d]{4,})"?/i);
        const lngM = text.match(/"?l(?:ng|on|ongitude)"?\s*:\s*"?([\d]{1,3}\.[\d]{4,})"?/i);
        if (latM && lngM) {
          return res.redirect(`https://www.google.com/maps?q=${latM[1]},${lngM[1]}&z=17`);
        }
      } catch(e) { continue; }
    }

    // Return full inline script for analysis
    return res.status(200).json({
      endpoints_found: allEndpoints,
      inline_scripts: scripts.substring(0, 3000)
    });

  } catch(err) {
    return res.status(200).json({ error: err.message });
  }
}
