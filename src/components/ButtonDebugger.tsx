import React from 'react';

// Debug component to test Button availability
const ButtonDebugger = () => {
  React.useEffect(() => {
    console.log('🔍 Button Debugger - Checking Button availability...');
    
    try {
      // Test 1: Check if Button is available via import
      import('@/components/ui/button').then((buttonModule) => {
        console.log('✅ Button module imported successfully:', buttonModule);
        console.log('✅ Button component:', buttonModule.Button);
        console.log('✅ buttonVariants:', buttonModule.buttonVariants);
      }).catch((error) => {
        console.error('❌ Failed to import Button module:', error);
      });
      
      // Test 2: Check global React availability
      if (typeof window !== 'undefined') {
        console.log('🌐 Window React:', (window as any).React);
        console.log('🌐 Global React:', typeof React);
      }
      
      // Test 3: Check if Button is in global scope
      if (typeof window !== 'undefined' && (window as any).Button) {
        console.log('✅ Button found in global scope');
      } else {
        console.log('⚠️ Button not found in global scope');
      }
      
    } catch (error) {
      console.error('❌ Button debugger error:', error);
    }
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>🔍 Button Debug Active</div>
      <div>Check console for details</div>
    </div>
  );
};

export default ButtonDebugger;
