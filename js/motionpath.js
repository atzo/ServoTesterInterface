class MotionPath {
    constructor(prevMotionPath, newKeyframe, timeline) {
        this.prevMotionPath = prevMotionPath || this;
        this.startKeyframe = newKeyframe;
        this.timeline = timeline;
        this.svg = timeline.svg;
        this.timelineWidth = timeline.width;
        this.timelineHeight = timeline.height;
        this.selectedState = false;

        // Handle the baseframe case
        if (newKeyframe instanceof Baseframe) {
            this.endKeyframe = newKeyframe;
            this.nextMotinPath = this; // Self-reference for the initial motion path
        } else {
            // For regular keyframes, link to the previous motion path
            this.endKeyframe = prevMotionPath.endKeyframe;
            this.nextMotinPath = prevMotionPath.nextMotinPath;
        }

        // Get start and end points
        let startX = this.startKeyframe instanceof Baseframe ? this.startKeyframe.xStart : this.startKeyframe.x;
        let startY = this.startKeyframe.y;
        let endX = this.endKeyframe instanceof Baseframe ? this.endKeyframe.xEnd : this.endKeyframe.x;
        let endY = this.endKeyframe.y;

        // Set initial control points
        this.control1RelX = 0.3; // Relative to start
        this.control1RelY = 0;
        this.control2RelX = 0.7; // Relative to end
        this.control2RelY = 0;

        // Calculate absolute control points
        let control1X = startX + (endX - startX) * this.control1RelX;
        let control1Y = startY + this.control1RelY;
        let control2X = endX - (endX - startX) * (1 - this.control2RelX);
        let control2Y = endY + this.control2RelY;

        // Control point elements
        this.control1 = null;
        this.control2 = null;
        this.controlLine1 = null;
        this.controlLine2 = null;
        this.draggingControl = null;

        this.createMotionPath();
        this.attachEventListeners();
    }

    createMotionPath() {
        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        this.path.setAttribute("stroke", "blue");
        this.path.setAttribute("fill", "none");
        this.path.setAttribute("stroke-width", "2");
        this.path.style.cursor = "pointer"; // Add pointer cursor
        this.svg.appendChild(this.path);

        // Add click event listener for path selection
        this.path.addEventListener("click", (event) => this.checkSelection(event));

        this.createControlPoints();
        this.createControlLines();
        this.updatePath();
    }

    createControlPoints() {
        this.control1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.control1.setAttribute("r", "5");
        this.control1.setAttribute("fill", "green");
        this.control1.setAttribute("visibility", "hidden");
        this.svg.appendChild(this.control1);
        this.attachDragEvents(this.control1, 'control1');

        this.control2 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.control2.setAttribute("r", "5");
        this.control2.setAttribute("fill", "green");
        this.control2.setAttribute("visibility", "hidden");
        this.svg.appendChild(this.control2);
        this.attachDragEvents(this.control2, 'control2');
    }

    createControlLines() {
        this.controlLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this.controlLine1.setAttribute("stroke", "gray");
        this.controlLine1.setAttribute("stroke-width", "1");
        this.controlLine1.setAttribute("visibility", "hidden");
        this.svg.appendChild(this.controlLine1);

        this.controlLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        this.controlLine2.setAttribute("stroke", "gray");
        this.controlLine2.setAttribute("stroke-width", "1");
        this.controlLine2.setAttribute("visibility", "hidden");
        this.svg.appendChild(this.controlLine2);
    }

    attachEventListeners() {
        this.boundDrag = this.drag.bind(this);
        this.boundStopDragging = this.stopDragging.bind(this);
    }

    attachDragEvents(control, type) {
        control.addEventListener("mousedown", (event) => this.startDragging(event, type));
    }

    startDragging(event, type) {
        console.log("Start dragging");
        event.stopPropagation();
        this.draggingControl = type;
        document.addEventListener("mousemove", this.boundDrag);
        document.addEventListener("mouseup", this.boundStopDragging);
    }

    drag(event) {
        console.log("Dragging");
        if (!this.draggingControl) return;

        // Get relative coordinates using SVG's coordinate transformation
        let pt = this.svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;

        // Transform the point from screen coordinates to SVG coordinates
        let svgP = pt.matrixTransform(this.svg.getScreenCTM().inverse());

        let startX = this.startKeyframe instanceof Baseframe ? this.startKeyframe.xStart : this.startKeyframe.x;
        let endX = this.endKeyframe instanceof Baseframe ? this.endKeyframe.xEnd : this.endKeyframe.x;

        if (this.draggingControl === 'control1') {
            this.control1RelX = (svgP.x - startX) / (endX - startX);
            this.control1RelY = svgP.y - this.startKeyframe.y;
        } else if (this.draggingControl === 'control2') {
            this.control2RelX = (svgP.x - startX) / (endX - startX);
            this.control2RelY = svgP.y - this.endKeyframe.y;
        }
        this.updatePath();
    }

    stopDragging() {
        console.log("Stop dragging");
        if (this.draggingControl) {
            // Emit change event when control point dragging ends
            this.timeline.emit('change', { 
                type: 'controlPoint', 
                control: this.draggingControl,
                values: {
                    control1RelX: this.control1RelX,
                    control1RelY: this.control1RelY,
                    control2RelX: this.control2RelX,
                    control2RelY: this.control2RelY
                }
            });
        }
        this.draggingControl = null;
        this.isHandlerReleased = true; // Set flag when handler is released
        document.removeEventListener("mousemove", this.boundDrag);
        document.removeEventListener("mouseup", this.boundStopDragging);
    }

    updatePath() {
        let startX = this.startKeyframe instanceof Baseframe ? this.startKeyframe.xStart : this.startKeyframe.x;
        let startY = this.startKeyframe.y;
        let endX = this.endKeyframe instanceof Baseframe ? this.endKeyframe.xEnd : this.endKeyframe.x;
        let endY = this.endKeyframe.y;

        let control1X = startX + (endX - startX) * this.control1RelX;
        let control1Y = startY + this.control1RelY;
        let control2X = endX - (endX - startX) * (1 - this.control2RelX);
        let control2Y = endY + this.control2RelY;

        let d = `M ${startX} ${startY} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${endX} ${endY}`;
        this.path.setAttribute("d", d);

        this.control1.setAttribute("cx", control1X);
        this.control1.setAttribute("cy", control1Y);
        this.control2.setAttribute("cx", control2X);
        this.control2.setAttribute("cy", control2Y);

        this.controlLine1.setAttribute("x1", startX);
        this.controlLine1.setAttribute("y1", startY);
        this.controlLine1.setAttribute("x2", control1X);
        this.controlLine1.setAttribute("y2", control1Y);

        this.controlLine2.setAttribute("x1", endX);
        this.controlLine2.setAttribute("y1", endY);
        this.controlLine2.setAttribute("x2", control2X);
        this.controlLine2.setAttribute("y2", control2Y);
    }

    checkSelection(event) {
        event.stopPropagation();
        event.preventDefault();

        // Get relative coordinates using SVG's coordinate transformation
        let pt = this.svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;

        // Transform the point from screen coordinates to SVG coordinates
        let svgP = pt.matrixTransform(this.svg.getScreenCTM().inverse());

        if (this.isPointOnBezierCurve(svgP.x, svgP.y, this.path, 5)) {
            // Deselect all other motion paths first
            let currentMotionPath = this.timeline.motionPaths;
            do {
                if (currentMotionPath !== this) {
                    currentMotionPath.selected(false);
                }
                currentMotionPath = currentMotionPath.nextMotinPath;
            } while (currentMotionPath && currentMotionPath !== this.timeline.motionPaths);

            // Select this motion path
            this.selected(true);
        }
    }

    selected(state) {
        if (this.isHandlerReleased) {
            this.isHandlerReleased = false;
            return;
        }

        this.selectedState = state;
        if (state) {
            this.path.setAttribute("stroke", "red");
            this.control1.setAttribute("visibility", "visible");
            this.control2.setAttribute("visibility", "visible");
            this.controlLine1.setAttribute("visibility", "visible");
            this.controlLine2.setAttribute("visibility", "visible");
        } else {
            this.path.setAttribute("stroke", "blue");
            this.control1.setAttribute("visibility", "hidden");
            this.control2.setAttribute("visibility", "hidden");
            this.controlLine1.setAttribute("visibility", "hidden");
            this.controlLine2.setAttribute("visibility", "hidden");
        }
    }

    getControlData() {
        const startX = this.startKeyframe instanceof Baseframe ? this.startKeyframe.xStart : this.startKeyframe.x;
        const startY = this.startKeyframe.y;
        const endX = this.endKeyframe instanceof Baseframe ? this.endKeyframe.xEnd : this.endKeyframe.x;
        const endY = this.endKeyframe.y;

        const control1X = startX + (endX - startX) * this.control1RelX;
        const control1Y = startY + this.control1RelY;
        const control2X = endX - (endX - startX) * (1 - this.control2RelX);
        const control2Y = endY + this.control2RelY;

        return {
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            control1: { x: control1X, y: control1Y },
            control2: { x: control2X, y: control2Y },
            control1Rel: { x: this.control1RelX, y: this.control1RelY },
            control2Rel: { x: this.control2RelX, y: this.control2RelY }
        };
    }

    isPointOnBezierCurve(px, py, pathElement, tolerance = 5) {
        const pathLength = pathElement.getTotalLength();
        const numSamples = 100;

        for (let i = 0; i <= numSamples; i++) {
            let point = pathElement.getPointAtLength((i / numSamples) * pathLength);
            let dx = point.x - px;
            let dy = point.y - py;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= tolerance) {
                return true;
            }
        }
        return false;
    }
}
