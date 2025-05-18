import React from 'react';
import LiveData from '../components/LiveData';

const LiveDataPage: React.FC = () => {
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-6">Live Sports Data</h1>
      <p className="text-gray-600 mb-6">
        View real-time scores and betting odds from live sports events around the world. 
        Data is updated automatically through our secure WebSocket connection.
      </p>
      <LiveData />
    </div>
  );
};

export default LiveDataPage;