// Debug Script for Audio Journal
console.log('🔍 Debug Script Loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM Ready - Checking app state...');
    
    // Check if elements exist
    const elements = [
        'loading-screen', 'app', 'timeline-view', 
        'entries-container', 'empty-state'
    ];
    
    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`#${id}:`, el ? '✅' : '❌');
    });
    
    // Check navigation
    const navBtns = document.querySelectorAll('.nav-btn');
    console.log(`Navigation buttons: ${navBtns.length}`);
    
    // Check if app is initialized
    setTimeout(() => {
        const appEl = document.getElementById('app');
        if (appEl) {
            console.log('App display style:', appEl.style.display);
            console.log('App visibility:', window.getComputedStyle(appEl).display);
        }
        
        const loadingEl = document.getElementById('loading-screen');
        if (loadingEl) {
            console.log('Loading screen display:', loadingEl.style.display);
        }
        
        // Check if initializeApp function exists
        if (window.initializeApp) {
            console.log('✅ initializeApp function found');
        } else {
            console.log('❌ initializeApp function missing');
        }
    }, 2000);
});
