export default async function handler(req, res) {
  const URL = 'https://eu.tracksolidpro.com//api/share?ver=2&method=trackDevice_abr&deviceinfo=7ae7c62385f2067ff94c6361aa1c47ce5c3acfc0bcfb4f521dc8f2183ca08dbb97fa76ba5c81e8197815b07c2d7350c4e438949af3a1cc98d08e0460c5edd13ae3e69384bc675234&deviceName=JC261P-62348&deviceIMEI=864993060962348';

  try {
    const response = await fetch(URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        'Accept': 'application/json, text/html, */*',
        'Referer': 'https://eu.tracksolidpro.com/'
      }
    });

    const text = await response.text();

    let lat, lng;

    // Try JSON first
    try {
      const data = JSON.parse(text);
      const str = JSON.stringify(data);
      const latM = str.match(/"lat[itude]*"\s*:\s*"?([\d.-]+)"?/i);
      const lngM = str.match(/"l(?:ng|on|ongitude)"\s*:\s*"?([\d.-]+)"?/i);
      if (latM && lngM) { lat = latM[1]; lng = lngM[1]; }
    } catch(e) {
      // Not JSON — try extract from HTML
      const latM = text.match(/lat[itude]*['":\s]+([\d]{1,3}\.\d{4,})/i);
      const lngM = text.match(/l(?:ng|on|ongitude)['":\s]+([\d]{1,3}\.\d{4,})/i);
      if (latM && lngM) { lat = latM[1]; lng = lngM[1]; }
    }

    if (!lat || !lng) {
      // Log raw response for debugging
      return res.status(200).json({ 
        error: 'no_coords', 
        raw: text.substring(0, 500) 
      });
    }

    return res.redirect(`https://www.google.com/maps?q=${lat},${lng}&z=17`);

  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
}
