import React, { memo } from 'react';
import { Channel } from '../lib/indexedDB';

interface ChannelRowProps {
  index: number;
  style: React.CSSProperties;
  data: Channel[];
}

const ChannelRow = ({ index, style, data }: ChannelRowProps) => {
  const channel = data[index];

  // Render a placeholder or nothing if channel doesn't exist (though list length should match)
  if (!channel) return null;

  return (
    <div style={style} className="flex items-center p-2 hover:bg-gray-800 border-b border-gray-700 transition-colors cursor-pointer">
      <div className="w-12 h-12 flex-shrink-0 bg-gray-900 rounded flex items-center justify-center mr-4 overflow-hidden">
        {channel.logo ? (
          <img 
            src={channel.logo} 
            alt={channel.name} 
            className="w-full h-full object-contain" 
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.png'; // Fallback
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
          <p className="text-xs text-gray-400 truncate">
            {channel.group}
          </p>
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

// Custom comparison function for React.memo
// Only re-render if the channel at this index has changed
const areEqual = (prevProps: ChannelRowProps, nextProps: ChannelRowProps) => {
  return (
    prevProps.index === nextProps.index &&
    prevProps.style === nextProps.style &&
    prevProps.data[prevProps.index] === nextProps.data[nextProps.index]
  );
};

export default memo(ChannelRow, areEqual);
