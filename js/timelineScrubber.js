class TimelineScrubber {
    // Static counter to track instances
    static instanceCount = 0;
    
    constructor(duration = 5, servos = []) {
        TimelineScrubber.instanceCount++;
        console.log(`TimelineScrubber constructor - Instance #${TimelineScrubber.instanceCount}`);
        this.instanceId = TimelineScrubber.instanceCount;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = duration; // Use the provided duration
        this.animationFrame = null;
        this.lastUpdateTime = null;
        this.resolution = 100; // Updates per second
        this.servos = servos; // Store the servos array
        this.stepSize = this.calculateStepSize();
        this.precalculatedValues = new Map(); // Store precalculated values for each servo
        this.loopStartTime = null; // Track when each loop starts
        
        // Bind event handlers
        this.handlePlayPause = this.handlePlayPause.bind(this);
        this.handleTimeSliderChange = this.handleTimeSliderChange.bind(this);
        this.updateTimeDisplay = this.updateTimeDisplay.bind(this);
        this.animate = this.animate.bind(this);
        
        // Initialize UI elements
        this.initializeUI();
    }

    calculateStepSize() {
        // Calculate step size based on duration and resolution
        // For example, if duration is 5 seconds and resolution is 10 updates per second,
        // we want 50 steps total, so step size is 0.1 seconds
        return (1 / this.resolution) * 1.6
    }

    initializeUI() {
        // Get UI elements
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.timeSlider = document.getElementById('timeSlider');
        this.timeDisplay = document.getElementById('timeDisplay');
        
        // Check if elements exist before adding event listeners
        if (this.playPauseBtn) {
            // Use the bound method
            this.playPauseBtn.addEventListener('click', this.handlePlayPause);
        } else {
            console.error('Play/Pause button not found');
        }
        
        if (this.timeSlider) {
            // Use the bound method
            this.timeSlider.addEventListener('input', this.handleTimeSliderChange);
            
            // Set initial values
            this.timeSlider.min = 0;
            this.timeSlider.max = this.duration;
            this.timeSlider.step = this.stepSize;
            this.timeSlider.value = this.currentTime;
        } else {
            console.error('Time slider not found');
        }
        
        // Initialize time display
        this.updateTimeDisplay();
    }

    handlePlayPause() {
        if (!this.playPauseBtn) {
            console.error('Play/Pause button not found');
            return;
        }
        
        this.isPlaying = !this.isPlaying;
        this.playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
        
        if (this.isPlaying) {
            // Precalculate values before starting playback
            this.precalculateAllValues();
            
            // Reset the timestamp to ensure proper animation start
            this.lastUpdateTime = performance.now();
            // Start the animation loop
            console.log("USB connection established");
            console.log("Sending switch on command");
            servoManager.webserial.sendSerial("switch input serial\n");
            
            // Get the selected output type and send the appropriate command
            const outputType = document.getElementById('outputType').value;
            const outputCommand = outputType === 'pwm' ? 'switch output pwm\n' : 'switch output i2c\n';
            servoManager.webserial.sendSerial(outputCommand);
            
            this.animationFrame = requestAnimationFrame(this.animate);
        } else {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);              
                this.animationFrame = null;
            }
        }
    }

    handleTimeSliderChange(event) {
        // Ensure we're getting a valid number
        const newValue = parseFloat(event.target.value);
        if (!isNaN(newValue)) {
            this.currentTime = newValue;
            this.updateTimeDisplay();
            this.updateTimelines();
        }
    }

    updateTimeDisplay() {
        if (this.timeDisplay) {
            // Ensure we're displaying a valid number
            const displayValue = isNaN(this.currentTime) ? 0 : this.currentTime;
            this.timeDisplay.textContent = displayValue.toFixed(2) + 's';
        }
        if (this.timeSlider) {
            this.timeSlider.value = this.currentTime;
        }
    }

    animate(currentTime) {
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = currentTime;
            this.loopStartTime = currentTime; // Record the start time of the loop
        }

        const deltaTime = currentTime - this.lastUpdateTime;
        const updateInterval = 1000 / this.resolution;

        if (deltaTime >= updateInterval) {
            // Move by one step
            this.currentTime += this.stepSize;
            this.lastUpdateTime = currentTime;

            // Reset to beginning when we reach the end
            if (this.currentTime >= this.duration) {
                // Log the total time taken for this loop
                const totalLoopTime = currentTime - this.loopStartTime;
                console.log(`Loop completed in ${totalLoopTime.toFixed(2)}ms (target: ${this.duration * 1000}ms)`);
                
                // Reset for the next loop
                this.currentTime = 0;
                this.lastUpdateTime = currentTime;
                this.loopStartTime = currentTime;
            }

            this.updateTimeDisplay();
            this.updateTimelines();
        } else {
            console.log("Not stepping");
        }	
       
        if (this.isPlaying) {
            this.animationFrame = requestAnimationFrame((time) => this.animate(time));
        }
    }

    setDuration(duration) {
        this.duration = duration;
        if (this.timeSlider) {
            this.timeSlider.max = duration;
            this.timeSlider.step = this.stepSize;
            this.timeSlider.value = 0;
            this.currentTime = 0;
        }
        if (this.currentTime > duration) {
            this.currentTime = 0;
            this.updateTimeDisplay();
        }
    }

    setResolution(resolution) {
        this.resolution = resolution;
        this.stepSize = this.calculateStepSize();
        if (this.timeSlider) {
            this.timeSlider.step = this.stepSize;
        }
    }

    precalculateAllValues() {
        this.precalculatedValues.clear();
        this.servos.forEach(servo => {
            if (servo && servo.timeline) {
                this.precalculatedValues.set(servo.id, servo.timeline.precalculateAnimationValues());
            }
        });
    }

    updateTimelines() {
        this.servos.forEach(servo => {
            if (!servo || !servo.enabled) return;

            const values = this.precalculatedValues.get(servo.id);
            if (!values) return;

            // Calculate the current step index based on currentTime
            const stepIndex = Math.floor((this.currentTime / this.duration) * (values.length - 1));
            const currentValue = values[stepIndex];

            // Send data to serial port if connected
            const servoManager = window.servoManager;
            if (servoManager && servoManager.isConnected && servoManager.webserial) {
                const serialData = `${servo.id},${currentValue}\n`;
                servoManager.webserial.sendSerial(serialData);
            }

            // Update the value in the status table
            const statusTable = document.querySelector('.status-section table tbody');
            if (statusTable) {
                const statusRow = statusTable.querySelector(`tr:nth-child(${servo.id})`);
                if (statusRow) {
                    const valueCell = statusRow.querySelector('td:nth-child(7)');
                    if (valueCell) {
                        valueCell.textContent = currentValue;
                    }
                }
            }

            // Update the time indicator position
            if (servo.timeline) {
                const position = (this.currentTime / this.duration) * 100;
                servo.timeline.updateTimeIndicator(position);
            }
            
        });
    }

    updateServos(servos) {
        this.servos = servos;
    }
}
