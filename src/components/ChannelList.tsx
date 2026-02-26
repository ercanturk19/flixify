import { useRef, useState, useEffect } from 'react';
import { useFilteredChannels } from '../store/useChannelStore';
import { Channel } from '../lib/indexedDB';

const ITEM_SIZE = 64; // Height of each row in pixels

interface ChannelListItemProps {
  channel: Channel;
}

const ChannelListItem = ({ channel }: ChannelListItemProps) => {
  return (
    <div 
      style={{ height: ITEM_SIZE }} 
      className="flex items-center p-2 hover:bg-gray-800 border-b border-gray-700 transition-colors cursor-pointer"
    >
      <div className="w-12 h-12 flex-shrink-0 bg-gray-900 rounded flex items-center justify-center mr-4 overflow-hidden">
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt={channel.name} 
            className="w-full h-full object-contain" 
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png';
            }}
          />
        ) : (
          <span className="text-xs text-gray-500">TV</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white truncate" title={channel.name}>
          {channel.name}
        </h3>
        {channel.group && (
          <p className="text-xs text-gray-400 truncate">{channel.group}</p>
        )}
      </div>
      <button 
        className="p-2 text-gray-400 hover:text-white"
        onClick={() => console.log('Play', channel.url)}
      >
        Play
      </button>
    </div>
  );
};

const ChannelList = () => {
  const filteredChannels = useFilteredChannels();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Simple resize observer to make the list responsive
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="flex-1 w-full h-full overflow-hidden bg-gray-900">
      {size.height > 0 && (
        <div className="overflow-y-auto h-full">
          {filteredChannels.map((channel) => (
            <ChannelListItem key={channel.id} channel={channel} />
          ))}
        </div>
      )}
      {filteredChannels.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          No channels found
        </div>
      )}
    </div>
  );
};

export default ChannelList;
