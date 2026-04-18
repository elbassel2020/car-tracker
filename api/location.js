export default async function handler(req, res) {

  const DEVICE_INFO = '7ae7c62385f2067ff94c6361aa1c47ce5c3acfc0bcfb4f521dc8f2183ca08dbb97fa76ba5c81e8194800bc78e639c80fa0b4686649e252f4d08e0460c5edd13ae3e69384bc675234';
  const IMEI = '864993060962348';
  const BASE = 'https://eu.tracksolidpro.com';

  // Step 1: Fetch the share page HTML to extract JS API calls
  const shareUrl = `${BASE}/api/share?ver=2&method=trackDevice_abr&deviceinfo=${DEVICE_INFO}&deviceName=JC261P-62348&deviceIMEI=${IMEI}`;

  try {
    const html = await fetch(shareUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 Chrome/91.0',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ar,en;q=0.9',
        'Referer': BASE
      }
    }).then(r => r.text());

    // Try to extract coordinates from HTML/JS variables
    let lat, lng;

    // Pattern 1: JSON embedded in page
    const jsonMatch = html.match(/\{[^{}]*"lat[itude]*"\s*:\s*"?([\d.-]+)"?[^{}]*"l(?:ng|on|ongitude)"\s*:\s*"?([\d.-]+)"?[^{}]*\}/i);
    if (jsonMatch) { lat = jsonMatch[1]; lng = jsonMatch[2]; }

    // Pattern 2: JS variables
    if (!lat) {
      const latM = html.match(/(?:lat|latitude)\s*[=:]\s*["']?([\d]{1,3}\.[\d]{4,})["']?/i);
      const lngM = html.match(/(?:lng|lon|longitude)\s*[=:]\s*["']?([\d]{1,3}\.[\d]{4,})["']?/i);
      if (latM && lngM) { lat = latM[1]; lng = lngM[1]; }
    }

    // Pattern 3: Look for map center coordinates
    if (!lat) {
      const coordMatch = html.match(/([\d]{1,3}\.[\d]{5,})\s*,\s*([\d]{1,3}\.[\d]{5,})/);
      if (coordMatch) { lat = coordMatch[1]; lng = coordMatch[2]; }
    }

    if (lat && lng) {
      return res.redirect(`https://www.google.com/maps?q=${lat},${lng}&z=17`);
    }

    // Step 2: Try direct API endpoints TrackSolid JS uses internally
    const apiEndpoints = [
      `/api/device/lastLocation?imei=${IMEI}&deviceinfo=${DEVICE_INFO}`,
      `/api/share/location?deviceinfo=${DEVICE_INFO}&imei=${IMEI}`,
      `/api/v2/device/location?deviceinfo=${DEVICE_INFO}`,
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const r = await fetch(`${BASE}${endpoint}`, {
          headers: { 
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
            'Referer': shareUrl
          }
        });
        const data = await r.json();
        const str = JSON.stringify(data);
        const latM = str.match(/"lat[itude]*"\s*:\s*"?([\d.-]+)"?/i);
        const lngM = str.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([\d.-]+)"?/i);
        if (latM && lngM) {
          return res.redirect(`https://www.google.com/maps?q=${latM[1]},${lngM[1]}&z=17`);
        }
      } catch(e) { continue; }
    }

    // Step 3: Debug — return what JS files the page loads
    const jsFiles = [...html.matchAll(/src=["']([^"']+\.js[^"']*)/g)].map(m => m[1]);
    return res.status(200).json({ 
      error: 'coords_not_found_in_html',
      js_files: jsFiles.slice(0, 5),
      html_sample: html.substring(0, 800)
    });

  } catch(err) {
    return res.status(200).json({ error: err.message });
  }
}
