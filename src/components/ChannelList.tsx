import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useFilteredChannels } from '../store/useChannelStore';
import ChannelRow from './ChannelRow';
import { Channel } from '../lib/indexedDB';

const ITEM_SIZE = 64; // Height of each row in pixels

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
    return () => observer.disconnect();
  }, []);

  // Use memoized item data wrapper to pass to the list
  // This prevents the inline function creation on every render
  const itemData = useMemo(() => filteredChannels, [filteredChannels]);

  return (
    <div ref={containerRef} className="flex-1 w-full h-full overflow-hidden bg-gray-900">
      {size.height > 0 && (
        <List
          height={size.height}
          itemCount={filteredChannels.length}
          itemSize={ITEM_SIZE}
          width={size.width}
          itemData={itemData}
          overscanCount={5} // Render 5 extra items outside visible area for smoother scrolling
        >
          {ChannelRow}
        </List>
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
