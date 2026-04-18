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

    // Pattern 1: setView([lat, lng]) — Leaflet map init
    const setViewMatch = html.match(/setView\s*\(\s*\[?\s*([\d.-]{6,})\s*,\s*([\d.-]{6,})/);
    if (setViewMatch) {
      const lat = setViewMatch[1], lng = setViewMatch[2];
      return res.redirect(`https://www.google.com/maps?q=${lat},${lng}&z=17`);
    }

    // Pattern 2: center: [lat, lng]
    const centerMatch = html.match(/center\s*[=:]\s*\[?\s*([\d.-]{6,})\s*,\s*([\d.-]{6,})/);
    if (centerMatch) {
      return res.redirect(`https://www.google.com/maps?q=${centerMatch[1]},${centerMatch[2]}&z=17`);
    }

    // Pattern 3: var lat = ..., var lng = ...
    const varLatMatch = html.match(/var\s+(?:lat|latitude|gpsLat)\s*=\s*([\d.-]{4,})/i);
    const varLngMatch = html.match(/var\s+(?:lng|lon|longitude|gpsLng)\s*=\s*([\d.-]{4,})/i);
    if (varLatMatch && varLngMatch) {
      return res.redirect(`https://www.google.com/maps?q=${varLatMatch[1]},${varLngMatch[1]}&z=17`);
    }

    // Pattern 4: L.marker([lat, lng])
    const markerMatch = html.match(/L\.marker\s*\(\s*\[?\s*([\d.-]{6,})\s*,\s*([\d.-]{6,})/);
    if (markerMatch) {
      return res.redirect(`https://www.google.com/maps?q=${markerMatch[1]},${markerMatch[2]}&z=17`);
    }

    // Pattern 5: any 2 consecutive decimal numbers > 5 digits (GPS coords)
    const allCoords = [...html.matchAll(/([\d]{1,3}\.[\d]{5,})/g)].map(m => parseFloat(m[1]));
    const lats = allCoords.filter(n => n > 10 && n < 70);
    const lngs = allCoords.filter(n => n > 30 && n < 180);
    if (lats.length && lngs.length) {
      return res.redirect(`https://www.google.com/maps?q=${lats[0]},${lngs[0]}&z=17`);
    }

    // Debug: return the part of HTML that contains map-related code
    const mapIdx = html.indexOf('setView') !== -1 ? html.indexOf('setView') :
                   html.indexOf('center') !== -1 ? html.indexOf('center') :
                   html.indexOf('marker') !== -1 ? html.indexOf('marker') : 0;

    return res.status(200).json({
      msg: 'coords_not_found',
      map_section: html.substring(Math.max(0, mapIdx - 200), mapIdx + 500),
      full_html_length: html.length,
      // Look for numbers that could be coords
      decimal_numbers: allCoords.filter(n => n > 1 && n < 200).slice(0, 20)
    });

  } catch(err) {
    return res.status(200).json({ error: err.message });
  }
}
