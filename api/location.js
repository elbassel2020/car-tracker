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

    // Extract ALL script content
    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).join('\n');

    // Find AJAX/fetch/XHR calls
    const ajaxMatches = [...scripts.matchAll(/\$\.(ajax|get|post)\s*\(\s*[\{'"]/g)];
    const fetchMatches = [...scripts.matchAll(/fetch\s*\(/g)];
    const xhrMatches = [...scripts.matchAll(/XMLHttpRequest/g)];
    const setIntervalMatches = [...scripts.matchAll(/setInterval/g)];

    // Get the section around any ajax/fetch call
    let apiSection = '';
    const ajaxIdx = scripts.indexOf('$.ajax') !== -1 ? scripts.indexOf('$.ajax') :
                    scripts.indexOf('$.post') !== -1 ? scripts.indexOf('$.post') :
                    scripts.indexOf('$.get') !== -1 ? scripts.indexOf('$.get') :
                    scripts.indexOf('fetch(') !== -1 ? scripts.indexOf('fetch(') :
                    scripts.indexOf('setInterval') !== -1 ? scripts.indexOf('setInterval') : -1;

    if (ajaxIdx !== -1) {
      apiSection = scripts.substring(Math.max(0, ajaxIdx - 100), ajaxIdx + 1000);
    }

    // Return full scripts for analysis
    return res.status(200).json({
      has_ajax: ajaxMatches.length,
      has_fetch: fetchMatches.length,
      has_xhr: xhrMatches.length,
      has_setInterval: setIntervalMatches.length,
      api_section: apiSection,
      // Full scripts in chunks
      scripts_part1: scripts.substring(0, 3000),
      scripts_part2: scripts.substring(3000, 6000),
      scripts_part3: scripts.substring(6000, 9000),
    });

  } catch(err) {
    return res.status(200).json({ error: err.message });
  }
}
