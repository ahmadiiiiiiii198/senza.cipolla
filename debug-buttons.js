// Debug script to test button functionality
console.log('🔍 Starting button functionality debug...');

// Function to test all buttons on the page
function testAllButtons() {
    console.log('🔍 Testing all buttons on the page...');
    
    const buttons = document.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons on the page`);
    
    buttons.forEach((button, index) => {
        const text = button.textContent?.trim() || 'No text';
        const classes = button.className || 'No classes';
        const disabled = button.disabled;
        const hasClickHandler = button.onclick !== null || button.addEventListener;
        
        console.log(`Button ${index + 1}:`);
        console.log(`  Text: "${text}"`);
        console.log(`  Classes: "${classes}"`);
        console.log(`  Disabled: ${disabled}`);
        console.log(`  Has click handler: ${hasClickHandler}`);
        console.log('---');
    });
}

// Function to test cart functionality
function testCartFunctionality() {
    console.log('🛒 Testing cart functionality...');
    
    // Check if cart context is available
    try {
        // Look for cart buttons
        const cartButtons = document.querySelectorAll('button[title*="carrello"], button[title*="cart"]');
        console.log(`Found ${cartButtons.length} cart-related buttons`);
        
        cartButtons.forEach((button, index) => {
            console.log(`Cart Button ${index + 1}: "${button.textContent?.trim()}"`);
            console.log(`  Title: "${button.title}"`);
            console.log(`  Disabled: ${button.disabled}`);
        });
        
        // Check for shopping cart icon buttons
        const shoppingCartButtons = document.querySelectorAll('button svg[class*="lucide-shopping-cart"]');
        console.log(`Found ${shoppingCartButtons.length} shopping cart icon buttons`);
        
        // Test clicking a cart button
        const firstCartButton = document.querySelector('button[title*="carrello"]');
        if (firstCartButton) {
            console.log('🖱️ Testing cart button click...');
            firstCartButton.click();
            console.log('✅ Cart button clicked successfully');
        } else {
            console.log('❌ No cart button found to test');
        }
        
    } catch (error) {
        console.error('❌ Error testing cart functionality:', error);
    }
}

// Function to test navigation buttons
function testNavigationButtons() {
    console.log('🧭 Testing navigation buttons...');
    
    // Test scroll buttons
    const scrollButtons = document.querySelectorAll('button[onclick*="scroll"], button[onclick*="getElementById"]');
    console.log(`Found ${scrollButtons.length} scroll buttons`);
    
    scrollButtons.forEach((button, index) => {
        console.log(`Scroll Button ${index + 1}: "${button.textContent?.trim()}"`);
        console.log(`  OnClick: "${button.onclick}"`);
    });
    
    // Test gallery button specifically
    const galleryButton = document.querySelector('button[onclick*="gallery"]');
    if (galleryButton) {
        console.log('🖱️ Testing gallery button click...');
        try {
            galleryButton.click();
            console.log('✅ Gallery button clicked successfully');
        } catch (error) {
            console.error('❌ Error clicking gallery button:', error);
        }
    }
}

// Function to check for JavaScript errors
function checkForJSErrors() {
    console.log('🔍 Checking for JavaScript errors...');
    
    // Override console.error to catch errors
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
        errors.push(args);
        originalError.apply(console, args);
    };
    
    // Check for React errors
    if (window.React) {
        console.log('✅ React is loaded');
    } else {
        console.log('❌ React not found');
    }
    
    // Check for cart context
    try {
        const cartElement = document.querySelector('[data-testid="cart"], .cart, #cart');
        if (cartElement) {
            console.log('✅ Cart element found in DOM');
        } else {
            console.log('⚠️ No cart element found in DOM');
        }
    } catch (error) {
        console.error('❌ Error checking cart element:', error);
    }
    
    return errors;
}

// Function to test specific button types
function testSpecificButtons() {
    console.log('🎯 Testing specific button types...');
    
    // Test "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('button[title*="Aggiungi"], button[title*="carrello"]');
    console.log(`Found ${addToCartButtons.length} "Add to Cart" buttons`);
    
    addToCartButtons.forEach((button, index) => {
        console.log(`Add to Cart Button ${index + 1}:`);
        console.log(`  Text: "${button.textContent?.trim()}"`);
        console.log(`  Title: "${button.title}"`);
        console.log(`  Disabled: ${button.disabled}`);
        console.log(`  Classes: "${button.className}"`);
        
        // Test if button is clickable
        try {
            const rect = button.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            console.log(`  Visible: ${isVisible}`);
            console.log(`  Position: ${rect.x}, ${rect.y}`);
        } catch (error) {
            console.error(`  Error getting button position:`, error);
        }
    });
    
    // Test checkout buttons
    const checkoutButtons = document.querySelectorAll('button[onclick*="checkout"], button[class*="checkout"]');
    console.log(`Found ${checkoutButtons.length} checkout buttons`);
    
    // Test modal buttons
    const modalButtons = document.querySelectorAll('button[data-dismiss], button[aria-label*="close"]');
    console.log(`Found ${modalButtons.length} modal buttons`);
}

// Main debug function
function runButtonDebug() {
    console.log('🚀 Running comprehensive button debug...');
    console.log('');
    
    testAllButtons();
    console.log('');
    
    testCartFunctionality();
    console.log('');
    
    testNavigationButtons();
    console.log('');
    
    testSpecificButtons();
    console.log('');
    
    const errors = checkForJSErrors();
    console.log('');
    
    console.log('📊 Debug Summary:');
    console.log(`Total buttons found: ${document.querySelectorAll('button').length}`);
    console.log(`JavaScript errors: ${errors.length}`);
    console.log('');
    
    if (errors.length > 0) {
        console.log('❌ JavaScript errors found:');
        errors.forEach((error, index) => {
            console.log(`Error ${index + 1}:`, error);
        });
    } else {
        console.log('✅ No JavaScript errors detected');
    }
    
    console.log('🏁 Button debug complete!');
}

// Expose functions to global scope
window.testAllButtons = testAllButtons;
window.testCartFunctionality = testCartFunctionality;
window.testNavigationButtons = testNavigationButtons;
window.testSpecificButtons = testSpecificButtons;
window.checkForJSErrors = checkForJSErrors;
window.runButtonDebug = runButtonDebug;

// Auto-run debug after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runButtonDebug);
} else {
    setTimeout(runButtonDebug, 1000);
}

console.log('💡 You can also run these functions manually:');
console.log('  runButtonDebug() - Run full debug');
console.log('  testAllButtons() - Test all buttons');
console.log('  testCartFunctionality() - Test cart buttons');
console.log('  testNavigationButtons() - Test navigation buttons');
console.log('  testSpecificButtons() - Test specific button types');
console.log('  checkForJSErrors() - Check for JavaScript errors');
