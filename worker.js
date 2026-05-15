// Cloudflare Worker — Yahoo Finance proxy with CORS
// Deploy at https://dash.cloudflare.com → Workers & Pages → Create
// Then paste this code into the editor and Deploy.

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ticker = (url.searchParams.get('t') || '').toUpperCase();
    const range = url.searchParams.get('range') || '2mo';
    const interval = url.searchParams.get('interval') || '1d';

    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (!/^[A-Z.\-]{1,10}$/.test(ticker)) {
      return new Response(JSON.stringify({ error: 'bad ticker' }), {
        status: 400,
        headers: { 'content-type': 'application/json', ...cors },
      });
    }

    const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;
    const yRes = await fetch(yUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'accept': 'application/json',
      },
      cf: { cacheTtl: 15, cacheEverything: true },
    });

    const body = await yRes.text();
    return new Response(body, {
      status: yRes.status,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'public, max-age=15',
        ...cors,
      },
    });
  },
};
