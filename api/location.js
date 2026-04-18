export default async function handler(req, res) {

  const DEVICE_INFO = '7ae7c62385f2067ff94c6361aa1c47ce5c3acfc0bcfb4f521dc8f2183ca08dbb97fa76ba5c81e819020d99e5283a98b610e9a860db92b2a2d08e0460c5edd13ac265b625ca321bab';
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

    // Pattern 1: setView([lat, lng])
    const setViewMatch = html.match(/setView\s*\(\s*\[?\s*([\d.-]{6,})\s*,\s*([\d.-]{6,})/);
    if (setViewMatch) return res.redirect(`https://www.google.com/maps?q=${setViewMatch[1]},${setViewMatch[2]}&z=17`);

    // Pattern 2: center: [lat, lng]
    const centerMatch = html.match(/center\s*[=:]\s*\[?\s*([\d.-]{6,})\s*,\s*([\d.-]{6,})/);
    if (centerMatch) return res.redirect(`https://www.google.com/maps?q=${centerMatch[1]},${centerMatch[2]}&z=17`);

    // Pattern 3: var lat = X, var lng = X
    const varLat = html.match(/var\s+lat\s*=\s*([\d.-]{4,})/i);
    const varLng = html.match(/var\s+lng\s*=\s*([\d.-]{4,})/i);
    if (varLat && varLng) return res.redirect(`https://www.google.com/maps?q=${varLat[1]},${varLng[1]}&z=17`);

    // Pattern 4: L.marker([lat, lng])
    const markerMatch = html.match(/L\.marker\s*\(\s*\[?\s*([\d.-]{6,})\s*,\s*([\d.-]{6,})/);
    if (markerMatch) return res.redirect(`https://www.google.com/maps?q=${markerMatch[1]},${markerMatch[2]}&z=17`);

    // Pattern 5: any GPS-like coordinates in the HTML
    const coords = [...html.matchAll(/([\d]{1,3}\.[\d]{5,})/g)].map(m => parseFloat(m[1]));
    const lats = coords.filter(n => n > 10 && n < 70);
    const lngs = coords.filter(n => n > 30 && n < 180);
    if (lats.length && lngs.length) return res.redirect(`https://www.google.com/maps?q=${lats[0]},${lngs[0]}&z=17`);

    // No coords found — redirect to TrackSolid page directly
    return res.redirect(SHARE_URL);

  } catch(err) {
    return res.redirect(`https://eu.tracksolidpro.com/api/share?ver=2&method=trackDevice_abr&deviceinfo=${DEVICE_INFO}&deviceName=JC261P-62348&deviceIMEI=${IMEI}`);
  }
}
