class ServoManager {
    constructor() {
        this.servos = [];
        this.nextId = 1;
        this.tableBody = document.querySelector('.status-section tbody');
        
        // Wait for DOM to be fully loaded before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.setupEventListeners();
        this.loadFromStorage();
    }

    initializeServos(count) {
        for (let i = 0; i < count; i++) {
            this.addServo();
        }
    }

    setupEventListeners() {
        // Add servo button
        const addServoBtn = document.getElementById('addServo');
        if (addServoBtn) {
            addServoBtn.addEventListener('click', () => this.addServo());
        }

        // Remove servo button
        const removeServoBtn = document.getElementById('removeServo');
        if (removeServoBtn) {
            removeServoBtn.addEventListener('click', () => this.removeServo());
        }

        // Servo count input
        document.getElementById('servoCount').addEventListener('change', (e) => {
            const count = parseInt(e.target.value);
            this.setServoCount(count);
        });

        // Save configuration button
        const saveConfigBtn = document.getElementById('saveConfig');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => this.saveToFile());
        }

        // Load configuration button
        const loadConfigBtn = document.getElementById('loadConfig');
        if (loadConfigBtn) {
            loadConfigBtn.addEventListener('click', () => {
                const fileInput = document.getElementById('fileInput');
                if (fileInput) {
                    fileInput.click();
                }
            });
        }

        // New project button
        const newProjectBtn = document.getElementById('newProject');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => this.newProject());
        }

        // File input change
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.loadFromFile(e));
        }

        // Add control panel event listeners
        document.addEventListener('change', (e) => {
            if (e.target.matches('.servo-control input[type="text"]')) {
                const servoId = parseInt(e.target.dataset.id);
                const newName = e.target.value;
                const servo = this.servos.find(s => s.id === servoId);
                if (servo) {
                    servo.name = newName;
                    // Update the name in status section
                    const statusInput = document.querySelector(`.status-section input[data-id="${servoId}"]`);
                    if (statusInput) {
                        statusInput.value = newName;
                    }
                    this.saveToStorage();
                }
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('.servo-control input[type="checkbox"]')) {
                const servoId = parseInt(e.target.dataset.id);
                const servo = this.servos.find(s => s.id === servoId);
                if (servo) {
                    servo.type = e.target.checked;
                    this.saveToStorage();
                }
            }
        });

        // Auto-save on any change
        this.setupAutoSave();
    }

    setupAutoSave() {
        // Save to localStorage whenever any servo data changes
        const observer = new MutationObserver(() => {
            // Update servo data from the table
            this.servos.forEach(servo => {
                const row = this.tableBody.querySelector(`tr:nth-child(${servo.id})`);
                if (row) {
                    servo.name = row.querySelector('input[type="text"]').value;
                    servo.showInControl = row.querySelector('input[type="checkbox"]').checked;
                    servo.type = row.querySelector('.toggle-switch input').checked;
                    
                    // Fix limit inputs identification
                    const limitInputs = row.querySelectorAll('input[type="text"]');
                    servo.limitMin = parseInt(limitInputs[1].value);
                    servo.limitMax = parseInt(limitInputs[2].value);
                }
            });
            this.saveToStorage();
        });

        observer.observe(this.tableBody, { 
            childList: true, 
            subtree: true, 
            characterData: true 
        });
    }

    collectData() {
        return {
            servos: this.servos.map(servo => {
                // Get the timeline instance from the servo object
                const timelineInstance = servo.timeline;
                
                // Get motion paths data if timeline exists
                let motionPaths = [];
                let baseframe = null;
                let keyframes = [];
                
                if (timelineInstance && timelineInstance.motionPaths) {
                    // Get baseframe data explicitly
                    baseframe = {
                        xStart: timelineInstance.motionPaths.startKeyframe.xStart,
                        xEnd: timelineInstance.motionPaths.startKeyframe.xEnd,
                        value: timelineInstance.motionPaths.startKeyframe.y,
                    };

                    let currentMotionPath = timelineInstance.motionPaths.nextMotinPath;
                    while (currentMotionPath && currentMotionPath !== timelineInstance.motionPaths) {
                        // Get all control data
                        const controlData = currentMotionPath.getControlData();                                                
                        
                        motionPaths.push({                           
                            controlPoints: {
                                cp1x: controlData.control1Rel.x,
                                cp1y: controlData.control1Rel.y,
                                cp2x: controlData.control2Rel.x,
                                cp2y: controlData.control2Rel.y
                            }
                        });

                        // Collect keyframe data
                        keyframes.push({
                            position: currentMotionPath.startKeyframe.x,
                            value: currentMotionPath.startKeyframe.y
                        });

                        currentMotionPath = currentMotionPath.nextMotinPath;
                    }
                }
                
                return {
                    id: servo.id,
                    name: servo.name,
                    showInControl: servo.showInControl,
                    type: servo.type,
                    position: servo.position,
                    limitMin: servo.limitMin,
                    limitMax: servo.limitMax,
                    visual: servo.visual,
                    baseframe,
                    keyframes,
                    motionPaths
                };
            }),
            nextId: this.nextId
        };
    }

    saveToStorage() {
        const data = this.collectData();
        console.log('Saving data to storage:', data);
        localStorage.setItem('servoConfig', JSON.stringify(data));
    }

    loadData(data) {
        // Clear existing servos
        this.servos = [];
        
        // Load servos
        data.servos.forEach(servoData => {
            const servo = {
                id: servoData.id,
                name: servoData.name,
                showInControl: servoData.showInControl,
                type: servoData.type,
                position: servoData.position,
                limitMin: servoData.limitMin,
                limitMax: servoData.limitMax,
                visual: servoData.visual
            };
            
            // Add servo to the list
            this.servos.push(servo);
            
            // Update UI first
            this.updateTable();
            this.initializeControlPanel();
        });
                                    
        data.servos.forEach(servoData => {    
            const timelineContainer = document.querySelector(`.timeline-container[data-id="${servoData.id}"]`);
            if (timelineContainer && servoData.baseframe) {                
                const timeline = timelineContainer.timeline;            

                // Set baseframe dimensions               
                timeline.motionPaths.startKeyframe.setPosition(servoData.baseframe.value);
                
                // Load keyframes and motion paths
                if (servoData.keyframes && servoData.motionPaths) {
                    // First add all keyframes using addKeyframe
                    servoData.keyframes.forEach(keyframeData => {
                        console.log("Adding keyframe: " + keyframeData.position + " " + keyframeData.value);                        
                        timeline.addKeyframe(keyframeData.position, keyframeData.value);
                    });
                    
                    // Then set control points for each motion path
                    let currentMotionPath = timeline.motionPaths.nextMotinPath; // Start with first motion path after baseframe
                    let i = 0;
                    
                    while (currentMotionPath && currentMotionPath !== timeline.motionPaths) {
                        const motionPathData = servoData.motionPaths[i];
                        if (motionPathData && motionPathData.controlPoints) {
                            currentMotionPath.control1RelX = motionPathData.controlPoints.cp1x;
                            currentMotionPath.control1RelY = motionPathData.controlPoints.cp1y;
                            currentMotionPath.control2RelX = motionPathData.controlPoints.cp2x;
                            currentMotionPath.control2RelY = motionPathData.controlPoints.cp2y;
                            currentMotionPath.updatePath();
                        }
                        currentMotionPath = currentMotionPath.nextMotinPath;
                        i++;
                    }
                }
            }
        });
        
        // Update nextId
        this.nextId = data.nextId || this.servos.length + 1;
        //set the servo count input to the number of servos
        const servoCountInput = document.getElementById('servoCount');
        if (servoCountInput) {
            servoCountInput.value = this.servos.length;
        }        
    }

    loadFromStorage() {
        const savedData = localStorage.getItem('servoConfig');
        if (savedData) {
            try {
                console.log('Loading saved data:', savedData);
                const data = JSON.parse(savedData);
                this.loadData(data);
            } catch (e) {
                console.error('Error loading saved configuration:', e);
                this.initializeServos(3); // Fallback to default
            }
        } else {
            console.log('No saved data found, initializing with defaults');
            this.initializeServos(3); // No saved data, start with default
        }
    }

    saveToFile(e) {
        const data = this.collectData();
        console.log('Saving data:', data);
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'servo_config.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    loadFromFile(e) {
        const reader = new FileReader();
        reader.onload = (e) => {
            //try {
             //   console.log('File content:', e.target.result);
                const data = JSON.parse(e.target.result);
             //   console.log('Parsed data:', data);
                this.clearAll();
                this.loadData(data);
            //} catch (e) {
            //    console.error('Error loading file:', e);
            //    alert('Error loading file. Please check the file format.');
            //}
        };

        reader.onerror = (e) => {
            console.error('Error reading file:', e);
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(e.target.files[0]);
    }

    setServoCount(count) {
        if (count < 1 || count > 16) return;
        console.log("Setting servo count to: " + count);
        const currentCount = this.servos.length;
        const controlSection = document.getElementById('control-section');
        
        if (count > currentCount) {
            // Add servos
            for (let i = currentCount; i < count; i++) {
                this.addServo();
                // Initialize timeline only for the new servo
                const newServo = this.servos[this.servos.length - 1];
                if (newServo.showInControl) {
                    this.initializeTimeline(newServo, controlSection);
                }
            }
        } else if (count < currentCount) {
            // Remove servos from the end
            while (this.servos.length > count) {
                this.removeServo();
            }
        }
        
        // Update table and save
        this.updateTable();
        this.saveToStorage();
    }

    addServo() {
        const servo = {
            id: this.nextId++,
            name: `Servo ${this.servos.length + 1}`,
            showInControl: true,
            type: true,
            position: 90,
            limitMin: 0,
            limitMax: 180,
            visual: '🔄'
        };
        this.servos.push(servo);
    }

    removeServo() {
        if (this.servos.length <= 1) return; // Don't remove the last servo

        // Get the ID of the servo being removed
        const removedServoId = this.servos[this.servos.length - 1].id;
        
        // Remove the servo from the array
        this.servos.pop();
        
        // Remove its timeline from the DOM
        const timelineContainer = document.querySelector(`.timeline-container[data-id="${removedServoId}"]`);
        if (timelineContainer) {
            const servoControl = timelineContainer.closest('.servo-control');
            if (servoControl) {
                servoControl.remove();
            }
        }
    }

    renderServoRow(servo) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${servo.id}</td>
            <td><input type="text" value="${servo.name}" data-id="${servo.id}"></td>
            <td><input type="checkbox" ${servo.showInControl ? 'checked' : ''} data-id="${servo.id}"></td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${servo.type ? 'checked' : ''} data-id="${servo.id}">
                    <span class="slider"></span>
                </label>
            </td>
            <td>${servo.position}</td>
            <td><input type="text" value="${servo.limitMin}" data-id="${servo.id}"></td>
            <td><input type="text" value="${servo.limitMax}" data-id="${servo.id}"></td>
            <td>${servo.visual}</td>
        `;

        // Add event listeners
        this.addRowEventListeners(row);
        this.tableBody.appendChild(row);
    }

    addRowEventListeners(row) {
        const id = parseInt(row.querySelector('input[type="text"]').dataset.id);
        const servo = this.servos.find(s => s.id === id);
        if (!servo) return;

        // Name change
        row.querySelector('input[type="text"]').addEventListener('change', (e) => {
            servo.name = e.target.value; 
            
            // Find and update the name in the timeline
            const timelineContainer = document.querySelector(`.timeline-container[data-id="${servo.id}"]`);
            if (timelineContainer) {
                // Find the parent servo-control div
                const servoControl = timelineContainer.closest('.servo-control');
                if (servoControl) {
                    // Update the name in the servo info section
                    const nameInput = servoControl.querySelector('.servo-info input[type="text"]');
                    if (nameInput) {
                        nameInput.value = e.target.value;
                    }
                }
            }
            
            this.saveToStorage();
        });

        // Show in control change
        row.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
            servo.showInControl = e.target.checked;
            
            // Find the timeline container for this servo
            const timelineContainer = document.querySelector(`.timeline-container[data-id="${servo.id}"]`);
            if (timelineContainer) {
                // Find the parent servo-control div
                const servoControl = timelineContainer.closest('.servo-control');
                if (servoControl) {
                    // Show or hide the entire servo control section
                    servoControl.style.display = e.target.checked ? 'flex' : 'none';
                }
            }
            
            this.saveToStorage();
        });

        // Type toggle change
        row.querySelector('.toggle-switch input').addEventListener('change', (e) => {
            servo.type = e.target.checked;
            this.saveToStorage();
        });

        // Limit changes
        const limitInputs = row.querySelectorAll('input[type="text"]');
        limitInputs[1].addEventListener('change', (e) => {
            servo.limitMin = parseInt(e.target.value);
            this.saveToStorage();
        });
        limitInputs[2].addEventListener('change', (e) => {
            servo.limitMax = parseInt(e.target.value);
            this.saveToStorage();
        });
    }

    updateTable() {
        this.tableBody.innerHTML = '';
        this.servos.forEach(servo => this.renderServoRow(servo));
    }

    
    initializeControlPanel() {
        const controlSection = document.getElementById('control-section');
        controlSection.innerHTML = '<h2>Control Panel</h2>';
        
        this.servos.forEach(servo => {
            if (servo.showInControl) {
                this.initializeTimeline(servo, controlSection);
            }
        });
    }   

    initializeTimeline(servo, controlSection) {
        const servoContainer = document.createElement('div');
        servoContainer.className = 'servo-control';
        servoContainer.setAttribute('data-servo-id', servo.id);
        
        // Create servo info section
        const servoInfo = document.createElement('div');
        servoInfo.className = 'servo-info';
        servoInfo.innerHTML = `
            <p>Servo ${servo.id}</p>
            <input type="text" value="${servo.name}" data-id="${servo.id}">
            <div class="loop-control">
                <input type="checkbox" ${servo.type ? 'checked' : ''} data-id="${servo.id}">
                <span>Loop</span>
            </div>
        `;
        servoContainer.appendChild(servoInfo);
        
        // Create timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        timelineContainer.setAttribute('data-id', servo.id);
        
        // Create timeline with the correct parameters
        const timeline = new Timeline(servo.id, timelineContainer);
        timelineContainer.timeline = timeline;
        servo.timeline = timeline;
        
        // Add event listener for timeline changes
        timeline.addEventListener('change', () => {
            console.log('Timeline changed, saving to storage');
            this.saveToStorage();
        });
        
        servoContainer.appendChild(timelineContainer);
        controlSection.appendChild(servoContainer);
    }

    newProject() {
        // Clear everything first
        this.clearAll();
        
        // Initialize with default servo
        this.addServo();
        
        // Update UI
        this.updateTable();
        
        // Initialize control panel with the new servo
        const controlSection = document.getElementById('control-section');
        if (controlSection) {
            controlSection.innerHTML = '<h2>Control Panel</h2>';
            // Initialize timeline for the new servo
            const newServo = this.servos[0];
            if (newServo && newServo.showInControl) {
                this.initializeTimeline(newServo, controlSection);
            }
        }
        
        // Save the new state
        this.saveToStorage();
    }

    clearAll() {
        // Clear all servos
        this.servos = [];
        
        // Reset the nextId counter to 1
        this.nextId = 1;   
        
        // Clear the control section
        const controlSection = document.getElementById('control-section');
        if (controlSection) {
            controlSection.innerHTML = '<h2>Control Panel</h2>';
        }
        
        // Clear the status section table
        const tableBody = document.querySelector('.status-section tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        
        // Clear localStorage
        localStorage.removeItem('servoConfig');
        
        // Reset servo count input
        const servoCountInput = document.getElementById('servoCount');
        if (servoCountInput) {
            servoCountInput.value = '1';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    const servoManager = new ServoManager();
    if (!("serial" in navigator)) {
        const usbButton = document.getElementById("usbConnect");
        usbButton.disabled = true;
        usbButton.title = "Web Serial is not available in this browser version";
    }
});