// src/workers/m3uParser.worker.ts

interface ParseMessage {
  type: 'PARSE';
  url: string;
}

interface WorkerResponse {
  type: 'CHUNK' | 'DONE' | 'ERROR';
  data?: any[];
  error?: string;
  total?: number;
}

const BATCH_SIZE = 500;

self.onmessage = async (e: MessageEvent<ParseMessage>) => {
  if (e.data.type === 'PARSE') {
    try {
      await parseM3U(e.data.url);
    } catch (error) {
      self.postMessage({ type: 'ERROR', error: (error as Error).message });
    }
  }
};

async function parseM3U(url: string) {
  const response = await fetch(url);
  
  if (!response.body) {
    throw new Error('ReadableStream not supported in this browser or response body is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  
  let buffer = '';
  let channels: any[] = [];
  let currentChannel: any = {};
  let totalChannels = 0;

  // Optimized regex for EXTINF line parsing
  // #EXTINF:-1 tvg-id="ID" tvg-name="Name" tvg-logo="Logo",Channel Name
  const extInfRegex = /#EXTINF:(-?\d+)(?: (.*))?,(.*)/;
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      // Flush decoder
      buffer += decoder.decode();
      
      // Process remaining buffer
      if (buffer.trim()) {
        processLines(buffer.split(/\r?\n/));
      }
      // Send any remaining channels
      if (channels.length > 0) {
        self.postMessage({ type: 'CHUNK', data: channels });
      }
      self.postMessage({ type: 'DONE', total: totalChannels });
      break;
    }

    // Decode chunk and append to buffer
    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Split by newline, but keep the last part in buffer as it might be incomplete
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || ''; // Keep the last incomplete line

    processLines(lines);
  }

  function processLines(lines: string[]) {
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;

      if (trimmedLine.startsWith('#EXTINF:')) {
        // Parse metadata
        const match = extInfRegex.exec(trimmedLine);
        if (match) {
          const params = match[2] || '';
          const name = match[3] || 'Unknown Channel';
          
          // Simple extraction for common attributes to avoid complex regex overhead
          const logoMatch = params.match(/tvg-logo="([^"]*)"/);
          const groupMatch = params.match(/group-title="([^"]*)"/);
          const idMatch = params.match(/tvg-id="([^"]*)"/);

          currentChannel = {
            name: name.trim(),
            logo: logoMatch ? logoMatch[1] : undefined,
            group: groupMatch ? groupMatch[1] : undefined,
            id: idMatch ? idMatch[1] : crypto.randomUUID(), // Fallback ID
          };
        }
      } else if (!trimmedLine.startsWith('#')) {
        // It's a URL
        if (currentChannel.name) {
          currentChannel.url = trimmedLine;
          channels.push(currentChannel);
          currentChannel = {}; // Reset
          totalChannels++;

          if (channels.length >= BATCH_SIZE) {
            self.postMessage({ type: 'CHUNK', data: channels });
            channels = []; // Clear buffer
          }
        }
      }
    }
  }
}
