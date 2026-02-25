export const config = {
    runtime: 'edge', // Vercel Edge Runtime - 10 saniye limitini stream için kaldırır
};

export default async function handler(req) {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response('URL parametresi eksik.', { status: 400 });
    }

    // Preflight ve CORS Başlıkları
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders,
        });
    }

    try {
        const headersToForward = new Headers(req.headers);
        // Vercel / Target IP tespit araçlarını gizle
        headersToForward.delete('host');
        headersToForward.delete('origin');
        headersToForward.delete('referer');
        // IPTV sunucusunun yabancılamaması için popüler bir tarayıcı User-Agent'ı gönder
        headersToForward.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        headersToForward.set('accept', '*/*');

        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headersToForward,
            redirect: 'follow', // Yönlendirmeleri takip et
        });

        const newHeaders = new Headers(response.headers);

        // Gelen yanıttaki katı CORS kurallarını tam anlamıyla eziyoruz
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        newHeaders.set('Access-Control-Expose-Headers', '*');
        newHeaders.delete('x-frame-options');
        newHeaders.delete('content-security-policy'); // HLS.js için csp'yi gevşet

        // Video streamini bellekte biriktirmeden (Buffer aşımı yapmadan) doğrudan (pipe) olarak tarayıcıya geri döndür
        const { readable, writable } = new TransformStream();

        // Asenkron olarak veriyi akıt
        if (response.body) {
            response.body.pipeTo(writable).catch((err) => {
                console.error("Stream pipe hatası:", err);
            });
        } else {
            const writer = writable.getWriter();
            writer.close();
        }

        return new Response(readable, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
        });
    } catch (error) {
        return new Response('Proxy Hatası: ' + error.message, { status: 500 });
    }
}
