// Load scripts in sequence
window.onload = async function() {
    try {
        // Load all required scripts in the correct order
        await loadScript('js/motionpath.js');
        await loadScript('js/keyframe.js');
        await loadScript('js/baseframe.js');
        await loadScript('js/timeline.js');
        await loadScript('js/servoManager.js');

        document.getElementById('control-section')  .addEventListener('selectstart', (e) => {
            e.preventDefault();
        });            
        // Initialize ServoManager which will handle all timeline containers
        const servoManager = new ServoManager();
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
};

// Function to load a script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}