import React from 'react';

const Loading = ({ size = 'medium', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`loading-spinner ${sizeClasses[size]} mb-2`}></div>
      {text && <p className="text-secondary-600 text-sm">{text}</p>}
    </div>
  );
};

export default Loading; 