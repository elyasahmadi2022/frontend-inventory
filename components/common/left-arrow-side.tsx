import React from 'react';

const TableMoveLeft32LightIcon = ({
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
      strokeLinejoin="round"
      className=' dark:stroke-white'
      style={{
        opacity,
        transform: transforms.join(' ') || undefined,
        filter: shadow > 0 ? `drop-shadow(0 ${shadow}px ${shadow * 2}px rgba(0,0,0,0.3))` : undefined,
        backgroundColor: background !== 'transparent' ? background : undefined
      }}
    >
      <path fill="currentColor" d="M3 28.5a.5.5 0 0 0 1 0v-25a.5.5 0 0 0-1 0zm3.146-12.146a.5.5 0 0 1 0-.708l3-3a.5.5 0 0 1 .708.708L7.707 15.5H14.5a.5.5 0 0 1 0 1H7.707l2.147 2.146a.5.5 0 0 1-.708.708zM11 28.5a.5.5 0 0 0 .5.5h13a4.5 4.5 0 0 0 4.5-4.5v-17A4.5 4.5 0 0 0 24.5 3h-13a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5H20v8h-8.5a.5.5 0 0 0-.5.5zm9-7.5v7h-8v-7zm1 7v-7h7v3.5a3.5 3.5 0 0 1-3.5 3.5zm7-17h-7V4h3.5A3.5 3.5 0 0 1 28 7.5zm-8-7v7h-8V4zm8 16h-7v-8h7z"/>
    </svg>
  );
};

export default TableMoveLeft32LightIcon;