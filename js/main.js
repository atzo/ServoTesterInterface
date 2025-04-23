// Load scripts in sequence
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load all required scripts in sequence
async function loadAllScripts() {
    try {
        // Load WebSerial first
        await loadScript('js/webserial.js');
        
        // Then load the rest of the application scripts
        await loadScript('js/constants.js');
        await loadScript('js/timeline.js');
        await loadScript('js/baseframe.js');
        await loadScript('js/keyframe.js');
        await loadScript('js/motionpath.js');
        await loadScript('js/servoManager.js');
        await loadScript('js/timelineScrubber.js');
        
        // Initialize the application
        initializeApp();
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
}

// Initialize the application
function initializeApp() {
    // Create a new ServoManager instance
    const servoManager = new ServoManager();
    
    // Make the ServoManager instance globally accessible
    window.servoManager = servoManager;
    
    // Prevent text selection in the control section
    const controlSection = document.querySelector('.control-section');
    if (controlSection) {
        controlSection.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }
}

// Start loading scripts when the DOM is ready
document.addEventListener('DOMContentLoaded', loadAllScripts);