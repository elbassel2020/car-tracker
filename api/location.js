export default async function handler(req, res) {
  const URL = 'https://eu.tracksolidpro.com/api/share?ver=2&method=trackDevice_abr&deviceinfo=7ae7c62385f2067ff94c6361aa1c47ce5c3acfc0bcfb4f521dc8f2183ca08dbb97fa76ba5c81e8194800bc78e639c80fa0b4686649e252f4d08e0460c5edd13ae3e69384bc675234&deviceName=JC261P-62348&deviceIMEI=864993060962348';

  try {
    const response = await fetch(URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await response.json();

    // Extract coordinates from various possible formats
    let lat, lng, speed = 0;

    if (data.obj) {
      lat = data.obj.lat || data.obj.latitude;
      lng = data.obj.lng || data.obj.lon || data.obj.longitude;
      speed = data.obj.speed || 0;
    } else if (data.data) {
      lat = data.data.lat || data.data.latitude;
      lng = data.data.lng || data.data.lon;
      speed = data.data.speed || 0;
    } else {
      // Deep search
      const str = JSON.stringify(data);
      const latM = str.match(/"lat[itude]*"\s*:\s*([\d.-]+)/i);
      const lngM = str.match(/"l(?:ng|on|ongitude)"\s*:\s*([\d.-]+)/i);
      if (latM && lngM) { lat = latM[1]; lng = lngM[1]; }
    }

    if (!lat || !lng) {
      return res.redirect('/?error=no_gps');
    }

    // Redirect straight to Google Maps
    return res.redirect(`https://www.google.com/maps?q=${lat},${lng}&z=17`);

  } catch (err) {
    return res.redirect('/?error=fetch_failed');
  }
}
