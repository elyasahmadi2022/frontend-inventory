import React from 'react';

const TableMoveRight32LightIcon = ({
  size = 20,
  color = '#000000',
  strokeWidth = 1,
  background = 'transparent',
  opacity = 1,
  rotation = 0,
  shadow = 0,
  flipHorizontal = false,
  flipVertical = false,
  padding = 0
}) => {
  const transforms = [];
  if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
  if (flipHorizontal) transforms.push('scaleX(-1)');
  if (flipVertical) transforms.push('scaleY(-1)');

  const viewBoxSize = 24 + (padding * 2);
  const viewBoxOffset = -padding;
  const viewBox = `${viewBoxOffset} ${viewBoxOffset} ${viewBoxSize} ${viewBoxSize}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className=' dark:storke-white'
      strokeLinejoin="round"
      style={{
        opacity,
        transform: transforms.join(' ') || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== 'transparent' ? background : undefined
      }}
    >
      <path fill="currentColor" d="M29 3.5a.5.5 0 0 0-1 0v25a.5.5 0 0 0 1 0zm-3.146 12.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708l2.147-2.146H17.5a.5.5 0 0 1 0-1h6.793l-2.147-2.146a.5.5 0 0 1 .708-.708zM21 3.5a.5.5 0 0 0-.5-.5h-13A4.5 4.5 0 0 0 3 7.5v17A4.5 4.5 0 0 0 7.5 29h13a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5H12v-8h8.5a.5.5 0 0 0 .5-.5zM12 11V4h8v7zm-1-7v7H4V7.5A3.5 3.5 0 0 1 7.5 4zM4 21h7v7H7.5A3.5 3.5 0 0 1 4 24.5zm8 7v-7h8v7zM4 12h7v8H4z"/>
    </svg>
  );
};

export default TableMoveRight32LightIcon;