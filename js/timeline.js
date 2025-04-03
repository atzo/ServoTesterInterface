class Timeline {
    // Constants for coordinate conversion
    static SVG_PADDING_LEFT = 50;      // Left padding in SVG coordinates
    static SVG_PADDING_BOTTOM = 30;    // Bottom padding in SVG coordinates
    static SVG_PADDING_RIGHT = 20;     // Right padding in SVG coordinates
    static SVG_PADDING_TOP = 30;       // Top padding in SVG coordinates
    
    static TIMELINE_POSITION_MAX = 100;  // Maximum position value (0-100)
    static TIMELINE_VALUE_MAX = 180;     // Maximum value/angle (0-180)

    constructor(id, timeLineContainer, width = 1000, height = 200, duration = 5, minAngle = 0, maxAngle = 180) {
        if (!timeLineContainer) {
            throw new Error('Timeline container is required');
        }
        
        this.timeLineContainer = timeLineContainer;
        this.id = id;
        this.width = width;
        this.height = height;
        this.duration = duration;
        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.selectedKeyframe = null;
        this.eventListeners = new Map();
        
        // Initialize the timeline
        this.initialize();
    }

    initialize() {
        // Create SVG canvas
        this.svg = this.createSVGCanvas();
        if (!this.svg) {
            throw new Error('Failed to create SVG canvas');
        }

        // Initialize the rest of the timeline
        this.initAxes();
        this.drawLimits();
        this.attachEventListeners();
        
        // Create Baseframe and initial MotionPath
        let baseframe = new Baseframe(this);
        this.motionPaths = new MotionPath(null, baseframe, this);      
        this.motionPaths.nextMotinPath = this.motionPaths;       
    }

    createSVGCanvas() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
        svg.style.backgroundColor = "#f5f5f5";
        svg.style.borderRadius = "4px";
        this.timeLineContainer.appendChild(svg);
        return svg;
    }

    initAxes() {
        const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        axisGroup.setAttribute("class", "axes");
        this.svg.appendChild(axisGroup);

        // Create X-axis line
        const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        xAxis.setAttribute("x1", "50");
        xAxis.setAttribute("y1", this.height - 30);
        xAxis.setAttribute("x2", this.width - 20);
        xAxis.setAttribute("y2", this.height - 30);
        xAxis.setAttribute("stroke", "#333");
        xAxis.setAttribute("stroke-width", "2");
        axisGroup.appendChild(xAxis);

        // Create Y-axis line
        const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
        yAxis.setAttribute("x1", "50");
        yAxis.setAttribute("y1", "30");
        yAxis.setAttribute("x2", "50");
        yAxis.setAttribute("y2", this.height - 30);
        yAxis.setAttribute("stroke", "#333");
        yAxis.setAttribute("stroke-width", "2");
        axisGroup.appendChild(yAxis);

        // Add time scale labels
        this.drawXAxisLabels(axisGroup);
        
        // Add angle scale labels
        this.drawYAxisLabels(axisGroup);
    }

    drawXAxisLabels(axisGroup) {
        // Remove existing time labels
        const existingLabels = axisGroup.querySelectorAll('text');
        existingLabels.forEach(label => {
            if (label.getAttribute('class') === 'time-label') {
                label.remove();
            }
        });

        // Add new time labels based on duration
        for (let i = 0; i <= 10; i++) {
            let xPos = 50 + (i * (this.width - 70) / 10);           
            let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", xPos);
            label.setAttribute("y", this.height - 15);
            label.setAttribute("font-size", "12");
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("pointer-events", "none");
            label.setAttribute("class", "time-label");
            label.style.userSelect = "none";
            label.textContent = (i * this.duration / 10).toFixed(1);
            axisGroup.appendChild(label);
        }
    }

    drawYAxisLabels(axisGroup) {
        for (let i = 0; i <= 3; i++) {
            let yPos = this.height - 30 - (i * (this.height - 50) / 3);
            let angle = i * 60; // 0, 60, 120, 180
            
            let label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", "35");
            label.setAttribute("y", yPos);
            label.setAttribute("font-size", "12");
            label.setAttribute("text-anchor", "end");
            label.setAttribute("pointer-events", "none");
            label.style.userSelect = "none";
            label.textContent = angle;
            axisGroup.appendChild(label);
        }
    }

    drawLimits() {
        // Remove existing limits if any
        const existingLimits = this.svg.querySelector('.limits');
        if (existingLimits) {
            existingLimits.remove();
        }

        const limitGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        limitGroup.setAttribute("class", "limits");
        
        // Insert limits at the beginning of SVG to ensure they're behind everything
        this.svg.insertBefore(limitGroup, this.svg.firstChild);

        // Calculate limit positions
        const upperLimitY = Math.max(30, this.height - 30 - ((this.maxAngle / 180) * (this.height - 50)));
        const lowerLimitY = Math.min(this.height - 30, this.height - 30 - ((this.minAngle / 180) * (this.height - 50)));

        // Draw upper limit area
        const upperLimitRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        upperLimitRect.setAttribute("x", "50");
        upperLimitRect.setAttribute("y", "30");
        upperLimitRect.setAttribute("width", this.width - 70);
        upperLimitRect.setAttribute("height", Math.max(1, upperLimitY - 30));
        upperLimitRect.setAttribute("fill", "rgba(255, 0, 0, 0.1)");
        upperLimitRect.setAttribute("pointer-events", "none");
        limitGroup.appendChild(upperLimitRect);

        // Draw lower limit area
        const lowerLimitRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        lowerLimitRect.setAttribute("x", "50");
        lowerLimitRect.setAttribute("y", lowerLimitY);
        lowerLimitRect.setAttribute("width", this.width - 70);
        lowerLimitRect.setAttribute("height", Math.max(1, this.height - 30 - lowerLimitY));
        lowerLimitRect.setAttribute("fill", "rgba(255, 0, 0, 0.1)");
        lowerLimitRect.setAttribute("pointer-events", "none");
        limitGroup.appendChild(lowerLimitRect);
    }

    updateLimits(minAngle, maxAngle) {
        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.drawLimits();
    }

    attachEventListeners() {
        // Handle timeline clicks
        this.svg.addEventListener('click', (e) => {
            e.stopPropagation();
            // Only handle clicks directly on the SVG or its background
            if (e.target === this.svg || e.target === this.background) {
                this.deselectAllKeyframes();
                // Deselect all motion paths
                let currentMotionPath = this.motionPaths;
                do {
                    currentMotionPath.selected(false);
                    currentMotionPath = currentMotionPath.nextMotinPath;
                } while (currentMotionPath && currentMotionPath !== this.motionPaths);
            }
        });

        // Handle double click to add keyframes
        this.svg.addEventListener('dblclick', (e) => {
            e.preventDefault();
            
            // Get relative coordinates using SVG's coordinate transformation
            let pt = this.svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            
            // Transform the point from screen coordinates to SVG coordinates
            let svgP = pt.matrixTransform(this.svg.getScreenCTM().inverse());
            
            this.addKeyframe(svgP.x, svgP.y);
        });

        // Handle keydown events for delete keyframe
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelectedKeyframe();
            }
        });

        // Create bound event handlers for dragging
        this.handleMouseMove = (e) => this.handleDragging(e);
        this.handleMouseUp = () => this.stopDragging();
    }

    selectKeyframe(keyframe) {
        if (this.selectedKeyframe === keyframe) return; // Prevent reselecting the same keyframe
        
        // Deselect all keyframes first
        this.deselectAllKeyframes();
        
        // Select the clicked keyframe
        keyframe.selected(true);
        this.selectedKeyframe = keyframe;
    }

    deselectAllKeyframes() {
        let motionPath = this.motionPaths;
        do {           
            motionPath.endKeyframe.selected(false);
            motionPath = motionPath.nextMotinPath;
        } while (motionPath !== this.motionPaths);
        
        this.selectedKeyframe = null;
    }

    startDragging(keyframe, e) {
        this.dragging = true;
        this.draggedKeyframe = keyframe;
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
        this.dragStartTime = keyframe.time;
        this.dragStartAngle = keyframe.angle;

        // Add drag event listeners to the keyframe element
        keyframe.dot.addEventListener('mousemove', this.handleMouseMove);
        keyframe.dot.addEventListener('mouseup', this.handleMouseUp);
    }

    handleDragging(e) {
        if (!this.dragging || !this.draggedKeyframe) return;

        const dx = e.clientX - this.dragStartX;
        const dy = e.clientY - this.dragStartY;

        // Update time (x position)
        const newTime = Math.max(0, Math.min(100, this.dragStartTime + (dx / this.width) * 100));
        this.draggedKeyframe.time = newTime;

        // Update angle (y position)
        const newAngle = Math.max(0, Math.min(180, this.dragStartAngle - (dy / this.height) * 180));
        this.draggedKeyframe.angle = newAngle;

        // Update the keyframe position
        this.updateKeyframePosition(this.draggedKeyframe);
    }

    stopDragging() {
        if (this.dragging && this.draggedKeyframe) {
            this.dragging = false;
            this.draggedKeyframe = null;

            // Remove drag event listeners from the keyframe element
            this.draggedKeyframe.dot.removeEventListener('mousemove', this.handleMouseMove);
            this.draggedKeyframe.dot.removeEventListener('mouseup', this.handleMouseUp);
        }
    }

    findPrevMotionPath(xPos) {
        let motionPath = this.motionPaths;              
        
        do {
            let x1 = motionPath.startKeyframe.x || motionPath.startKeyframe.xStart;
            let x2 = motionPath.nextMotinPath.startKeyframe.x || motionPath.endKeyframe.xEnd;
           console.log("x1: " + x1 + " x2: " + x2 + " xPos: " + xPos);
            if (x1 < xPos && x2 > xPos) {
                return motionPath;
            }            
            motionPath = motionPath.nextMotinPath;
        } while (motionPath !== this.motionPaths);
        
        throw new Error("Error in function findPrevMotionPath!");
    }

    addKeyframe(position, value) {
        let xPos, yPos;        

        // If we received SVG coordinates directly (from double-click)
        if (typeof position === 'number' && typeof value === 'number') {
            xPos = position;
            yPos = value;
            
            // Convert coordinates to timeline values
            const timelineUnits = this.svgToTimelineUnits(xPos, yPos);
            position = timelineUnits.position;
            value = timelineUnits.value;
        } else {
            // Handle the case when position and value are timeline units (0-100, 0-180)
            const svgUnits = this.timelineToSvgUnits(position, value);
            xPos = svgUnits.x;
            yPos = svgUnits.y;
        }
        
        console.log("Adding keyframe 1: " + xPos + " yPos " + yPos);

        // Check if position is within valid range (50 to width-20)
        if (xPos < 50 || xPos > this.width - 20) return;

        let prevMotionPath = this.findPrevMotionPath(xPos);        
        let newKeyframe = new Keyframe(xPos, yPos, this.svg, this.width, this.height, this);
        let motionPath = new MotionPath(prevMotionPath, newKeyframe, this);
        
        prevMotionPath.nextMotinPath = motionPath;
        prevMotionPath.endKeyframe = newKeyframe;
        
        prevMotionPath.updatePath();
        this.emit('change', { type: 'add', keyframe: newKeyframe });
    }

    deleteSelectedKeyframe() {
        console.log("Removing selected keyframe!");  
        let motionPath = this.motionPaths;
        while(!(motionPath.endKeyframe instanceof Baseframe) && !motionPath.endKeyframe.selectedState){
            console.log("Brojimo loop");
            motionPath = motionPath.nextMotinPath;                  
        };

        if ((!(motionPath.nextMotinPath.startKeyframe instanceof Baseframe)) && motionPath.endKeyframe.selectedState){
            console.log("E tu brišem keyframe!!!");
            motionPath.endKeyframe.line.remove();
            motionPath.endKeyframe.dot.remove();            
            motionPath.endKeyframe = motionPath.nextMotinPath.endKeyframe;
            motionPath.nextMotinPath.path.remove();
            motionPath.nextMotinPath = motionPath.nextMotinPath.nextMotinPath;
            this.updatePaths();
            this.emit('change', { type: 'delete', keyframe: motionPath.endKeyframe });
        }
    }

    updatePaths() {
        let motionPath = this.motionPaths;
        do {
            motionPath.updatePath();
            motionPath = motionPath.nextMotinPath;
        } while (motionPath !== this.motionPaths);
    }

    resize(newWidth, newHeight) {
        if (newWidth < 200) newWidth = 200;
        if (newHeight < 100) newHeight = 100;
        
        this.width = newWidth;
        this.height = newHeight;
        
        // Update SVG dimensions
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.style.width = '100%';
        this.svg.style.height = '100%';
        
        // Clear existing content
        this.svg.innerHTML = '';
        
        // Redraw everything in the correct order
        this.initAxes();
        this.drawLimits();
        
        // Recreate baseframe first
        let baseframe = new Baseframe(this);
        this.motionPaths = new MotionPath(null, baseframe, this);
        
        // Recreate all keyframes and motion paths
        if (this.motionPaths) {
            let motionPath = this.motionPaths;
            let nextMotionPath = motionPath.nextMotinPath;
            
            while (nextMotionPath && !(nextMotionPath.endKeyframe instanceof Baseframe)) {
                let xPos = nextMotionPath.endKeyframe.x;
                let yPos = nextMotionPath.endKeyframe.y;
                
                let newKeyframe = new Keyframe(xPos, yPos, this.svg, this.width, this.height, this);
                let newMotionPath = new MotionPath(motionPath, newKeyframe, this);
                motionPath.nextMotinPath = newMotionPath;
                
                motionPath = newMotionPath;
                nextMotionPath = motionPath.nextMotinPath;
            }
        }
        
        // Update all paths
        this.updatePaths();
    }

    // Event handling methods
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }

    removeEventListener(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }

    // Utility functions for coordinate conversion
    svgToTimelineUnits(x, y) {
        // Convert SVG coordinates to timeline units (0-100 for position, 0-180 for value)
        const position = ((x - Timeline.SVG_PADDING_LEFT) / (this.width - (Timeline.SVG_PADDING_LEFT + Timeline.SVG_PADDING_RIGHT))) * Timeline.TIMELINE_POSITION_MAX;
        const value = Timeline.TIMELINE_VALUE_MAX - ((y - Timeline.SVG_PADDING_BOTTOM) / (this.height - (Timeline.SVG_PADDING_TOP + Timeline.SVG_PADDING_BOTTOM))) * Timeline.TIMELINE_VALUE_MAX;
        return { position, value };
    }

    timelineToSvgUnits(position, value) {
        // Convert timeline units (0-100 for position, 0-180 for value) to SVG coordinates
        const x = (position / Timeline.TIMELINE_POSITION_MAX) * (this.width - (Timeline.SVG_PADDING_LEFT + Timeline.SVG_PADDING_RIGHT)) + Timeline.SVG_PADDING_LEFT;
        const y = this.height - Timeline.SVG_PADDING_BOTTOM - ((value / Timeline.TIMELINE_VALUE_MAX) * (this.height - (Timeline.SVG_PADDING_TOP + Timeline.SVG_PADDING_BOTTOM)));
        return { x, y };
    }

    getKeyframeData() {
        const keyframes = [];
        let motionPath = this.motionPaths;
        console.log("getKeyframeData");
        do {
            // Skip the baseframe
            if (!(motionPath.endKeyframe instanceof Baseframe)) {                
                const { position, value } = this.svgToTimelineUnits(motionPath.endKeyframe.x, motionPath.endKeyframe.y);
                keyframes.push({ position, value });
            }
            motionPath = motionPath.nextMotinPath;
        } while (motionPath !== this.motionPaths);
        return keyframes;
    }

    loadMotionPathData(motionPaths) {
        // Clear existing motion paths except baseframe
        let currentMotionPath = this.motionPaths;
        while (currentMotionPath.nextMotinPath && !(currentMotionPath.nextMotinPath.endKeyframe instanceof Baseframe)) {
            currentMotionPath.nextMotinPath.endKeyframe.line.remove();
            currentMotionPath.nextMotinPath.endKeyframe.dot.remove();
            currentMotionPath.nextMotinPath.path.remove();
            currentMotionPath.nextMotinPath = currentMotionPath.nextMotinPath.nextMotinPath;
        }

        // Add new motion paths
        motionPaths.forEach(mp => {
            // Convert timeline units to SVG coordinates
            const { x: xPos, y: yPos } = this.timelineToSvgUnits(mp.position, mp.value);

            // Create new keyframe
            const newKeyframe = new Keyframe(xPos, yPos, this.svg, this.width, this.height, this);
            
            // Create new motion path
            const newMotionPath = new MotionPath(currentMotionPath, newKeyframe, this);
            
            // Set control points if they exist
            if (mp.controlPoints) {
                newMotionPath.controlPoints = {
                    cp1x: mp.controlPoints.cp1x,
                    cp1y: mp.controlPoints.cp1y,
                    cp2x: mp.controlPoints.cp2x,
                    cp2y: mp.controlPoints.cp2y
                };
            }

            // Update the chain
            currentMotionPath.nextMotinPath = newMotionPath;
            currentMotionPath = newMotionPath;
        });

        // Update all paths
        this.updatePaths();
    }

    setDuration(duration) {
        this.duration = duration;
        const axisGroup = this.svg.querySelector('.axes');
        if (axisGroup) {
            this.drawXAxisLabels(axisGroup);
        }
    }

    updateTimeLabels() {
        const axisGroup = this.svg.querySelector('.axes');
        if (axisGroup) {
            this.drawXAxisLabels(axisGroup);
        }
    }
}
