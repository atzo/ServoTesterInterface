class Keyframe {
    constructor(x, y, svg, timelineWidth, timelineHeight, timeline) {
        this.svg = svg;
        this.timelineWidth = timelineWidth;
        this.timelineHeight = timelineHeight;
        this.x = x;
        this.y = y;
        this.timeline = timeline; // Reference to the timeline
        this.selectedState = false;        
        this.createKeyframeElement();
    }

    createKeyframeElement() {        
        // Create the vertical line
        this.line = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.line.setAttribute("x", this.x-1);
        this.line.setAttribute("y", 20);
        this.line.setAttribute("width", 2);
        this.line.setAttribute("height", this.timelineHeight-50);
        this.line.setAttribute("fill", "blue");        
        this.line.setAttribute("stroke", "transparent");
        this.line.setAttribute("stroke-width", "10");
        this.line.classList.add("keyframe-line");
        this.svg.appendChild(this.line);

        // Create the dot
        this.dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.dot.setAttribute("cx", this.x);
        this.dot.setAttribute("cy", this.y);
        this.dot.setAttribute("r", "5");
        this.dot.setAttribute("fill", "blue");
        this.dot.classList.add("keyframe-dot");
        this.svg.appendChild(this.dot);

        // Attach event listeners
        this.line.addEventListener("click", (event) => this.selectKeyframe(event));
        this.dot.addEventListener("click", (event) => this.selectKeyframe(event));

        this.dot.addEventListener("mousedown", (event) => this.startDragging(event, true));
        this.line.addEventListener("mousedown", (event) => this.startDragging(event, false));
        document.addEventListener("keydown", (event) => this.handleArrowKey(event));
    }

    startDragging(event, isDot) {
        console.log("Start dragging"); 
        event.stopPropagation();
        this.dragging = true;
        this.draggingDot = isDot;

        // Add drag event listeners only when starting to drag
        this.handleMouseMove = (e) => this.drag(e);
        this.handleMouseUp = () => this.stopDragging();
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
    }

    selectKeyframe(event) {
        console.log("Select keyframe");
        event.stopPropagation();
        event.preventDefault();
        
        // First deselect all keyframes in the timeline
        this.timeline.deselectAllKeyframes();
        
        // Deselect all motion paths
        let currentMotionPath = this.timeline.motionPaths;
        do {
            currentMotionPath.selected(false);
            currentMotionPath = currentMotionPath.nextMotinPath;
        } while (currentMotionPath && currentMotionPath !== this.timeline.motionPaths);
        
        // Then select this keyframe
        this.selected(true);
        
        // Store this as the selected keyframe in the timeline
        this.timeline.selectedKeyframe = this;        
    }

    selected(state) {
        this.selectedState = state;
        if (this.selectedState) {
            this.line.setAttribute("fill", "red");
            this.dot.setAttribute("fill", "red");
            this.line.style.cursor = "ew-resize"; // Horizontal resize cursor for line
            this.dot.style.cursor = "ns-resize"; // Vertical resize cursor for dot
            
            // Add keydown event listener to prevent default behavior
            this.keydownHandler = (event) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                    event.preventDefault();
                }
            };
            document.addEventListener("keydown", this.keydownHandler);
        } else {
            this.line.setAttribute("fill", "blue");
            this.dot.setAttribute("fill", "blue");
            this.line.style.cursor = "pointer";
            this.dot.style.cursor = "pointer";
            
            // Remove keydown event listener
            if (this.keydownHandler) {
                document.removeEventListener("keydown", this.keydownHandler);
                this.keydownHandler = null;
            }
        }
    }

    setPosition(newX, newY) {
        console.log("Set position" + newX + " " + newY);
        this.x = newX;
        this.y = newY;
        this.line.setAttribute("x", this.x-1);       
        this.line.setAttribute("height", this.timelineHeight-50);
        this.dot.setAttribute("cx", this.x);
        this.dot.setAttribute("cy", this.y);
        this.timeline.updatePaths();
    }

    resize(newWidth, newHeight) {
        this.timelineWidth = newWidth;
        this.timelineHeight = newHeight;
        this.setPosition(this.x, this.y);
    }

    drag(event) {        
        if (!this.dragging) return;        
        
        // Get relative coordinates using SVG's coordinate transformation
        let pt = this.svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        
        // Transform the point from screen coordinates to SVG coordinates
        let svgP = pt.matrixTransform(this.svg.getScreenCTM().inverse());
        
        if (this.draggingDot) {
            // Move only up/down (Y-axis)
            this.setPosition(this.x, svgP.y);
        } else {
            // Move only left/right (X-axis)
            this.setPosition(svgP.x, this.y);
        }
    }

    stopDragging() {
        if (this.dragging) {
            this.dragging = false;
            // Remove drag event listeners when stopping drag
            document.removeEventListener("mousemove", this.handleMouseMove);
            document.removeEventListener("mouseup", this.handleMouseUp);
            // Emit change event when dragging ends
            this.timeline.emit('change', { type: 'move', keyframe: this });
        }
    }

    handleArrowKey(event) {
        if (!this.selectedState) return;

        const step = 5; // Adjust movement step
        let newX = this.x;
        let newY = this.y;

        switch (event.key) {
            case "ArrowUp":
                newY -= step; // Move up
                break;
            case "ArrowDown":
                newY += step; // Move down
                break;
            case "ArrowLeft":
                newX -= step; // Move left
                break;
            case "ArrowRight":
                newX += step; // Move right
                break;
            default:
                return; // Ignore other keys
        }

        this.setPosition(newX, newY);
        // Emit change event when moved by arrow keys
        this.timeline.emit('change', { type: 'move', keyframe: this });
    }
}
