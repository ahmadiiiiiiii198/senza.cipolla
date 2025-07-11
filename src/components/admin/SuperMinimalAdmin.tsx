import React from 'react';

const SuperMinimalAdmin = () => {
  console.log('🚀 [SuperMinimal] Component rendering...');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ Super Minimal Admin Panel</h1>
      <p>If you can see this, React is working fine!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '10px', 
        marginTop: '20px',
        borderRadius: '5px'
      }}>
        <h3>Basic Test Results:</h3>
        <ul>
          <li>✅ React component rendering</li>
          <li>✅ JavaScript execution</li>
          <li>✅ CSS styling</li>
          <li>✅ Date/time functions</li>
        </ul>
      </div>

      <button 
        onClick={() => alert('Button clicked! Admin panel is working.')}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          marginTop: '20px',
          cursor: 'pointer'
        }}
      >
        Test Button
      </button>
    </div>
  );
};

export default SuperMinimalAdmin;
