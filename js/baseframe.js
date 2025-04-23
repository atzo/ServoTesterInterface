class Baseframe {
    constructor(timeline) {
        this.timeline = timeline;
        this.svg = timeline.svg;
        this.timelineWidth = timeline.width;
        this.timelineHeight = timeline.height;
        this.selectedState = false;
        
        // Define x-coordinates for both positions
        this.xStart = SVG_PADDING_LEFT;
        this.xEnd = this.timelineWidth - SVG_PADDING_RIGHT;
        
        this.createKeyframeElements();
    }

    getStartX() {
        // Recalculate x-coordinate to 1-100 range
        const availableWidth = this.timelineWidth - (SVG_PADDING_LEFT + SVG_PADDING_RIGHT);
        return  ((this.xStart - SVG_PADDING_LEFT) / availableWidth) * 100;
    }

    getEndX() {
        // Recalculate x-coordinate to 1-100 range
        const availableWidth = this.timelineWidth - (SVG_PADDING_LEFT + SVG_PADDING_RIGHT);
        return  ((this.xEnd - SVG_PADDING_LEFT) / availableWidth) * 100;
    }

    createKeyframeElements() {
        this.y = this.timelineHeight / 2;

        // Create first position line
        this.lineStart = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.lineStart.setAttribute("x", this.xStart - 1);
        this.lineStart.setAttribute("y", 20);
        this.lineStart.setAttribute("width", 2);
        this.lineStart.setAttribute("height", this.timelineHeight - 50);
        this.lineStart.setAttribute("fill", "blue");
        this.lineStart.setAttribute("stroke", "transparent");
        this.lineStart.setAttribute("stroke-width", "10");
        this.svg.appendChild(this.lineStart);

        // Create last position line
        this.lineEnd = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.lineEnd.setAttribute("x", this.xEnd - 1);
        this.lineEnd.setAttribute("y", 20);
        this.lineEnd.setAttribute("width", 2);
        this.lineEnd.setAttribute("height", this.timelineHeight - 50);
        this.lineEnd.setAttribute("fill", "blue");
        this.lineEnd.setAttribute("stroke", "transparent");
        this.lineEnd.setAttribute("stroke-width", "10");
        this.svg.appendChild(this.lineEnd);

        // Create the first position dot
        this.dotStart = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.dotStart.setAttribute("cx", this.xStart);
        this.dotStart.setAttribute("cy", this.y);
        this.dotStart.setAttribute("r", "5");
        this.dotStart.setAttribute("fill", "blue");
        this.svg.appendChild(this.dotStart);

        // Create the last position dot
        this.dotEnd = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        this.dotEnd.setAttribute("cx", this.xEnd);
        this.dotEnd.setAttribute("cy", this.y);
        this.dotEnd.setAttribute("r", "5");
        this.dotEnd.setAttribute("fill", "blue");
        this.svg.appendChild(this.dotEnd);

        // Attach event listeners
        this.dotStart.addEventListener("click", (event) => this.selectKeyframe(event));
        this.dotEnd.addEventListener("click", (event) => this.selectKeyframe(event));
        this.dotStart.addEventListener("mousedown", (event) => this.startDragging(event));
        this.dotEnd.addEventListener("mousedown", (event) => this.startDragging(event));
        document.addEventListener("mousemove", (event) => this.drag(event));
        document.addEventListener("mouseup", () => this.stopDragging());
        document.addEventListener("keydown", (event) => this.handleArrowKey(event));
    }

    startDragging(event) {
        event.stopPropagation();
        this.dragging = true;
    }

    drag(event) {
        if (!this.dragging) return;
        let rect = this.svg.getBoundingClientRect();
        let newY = event.clientY - rect.top;
        this.setPosition(newY);
    }

    stopDragging() {
        if (this.dragging) {
            this.dragging = false;
            // Emit change event when dragging ends
            this.timeline.emit('change', { type: 'baseframe', value: this.y });
        }
    }

    handleArrowKey(event) {
        if (!this.selectedState) return;

        const step = 5;
        let newY = this.y;

        switch (event.key) {
            case "ArrowUp":
                newY -= step;
                break;
            case "ArrowDown":
                newY += step;
                break;
            default:
                return;
        }
        this.setPosition(newY);
        // Emit change event when moved by arrow keys
        this.timeline.emit('change', { type: 'baseframe', value: this.y });
    }    

    setPosition(newY) {
        this.y = newY;
        this.dotStart.setAttribute("cy", this.y);
        this.dotEnd.setAttribute("cy", this.y);
        this.timeline.updatePaths();
    }

    resize(newWidth, newHeight) {
        // Ensure we have valid dimensions
        newWidth = Math.max(newWidth, 200);
        newHeight = Math.max(newHeight, 100);
        
        this.timelineWidth = newWidth;
        this.timelineHeight = newHeight;
        this.xEnd = this.timelineWidth - 20; // Update xEnd after resize
        this.setPosition(this.y);
    }

    selectKeyframe(event) {
        event.stopPropagation(); // Prevent deselection when clicking on a keyframe
        this.timeline.deselectAllKeyframes(); // Deselect all other keyframes
        this.selected(true);
    }

    selected(state) {
        this.selectedState = state;
        if (this.selectedState) {            
            this.dotStart.setAttribute("fill", "red");
            this.dotEnd.setAttribute("fill", "red");            
            this.dotStart.style.cursor = "ns-resize"; // Vertical resize cursor for dot
            this.dotEnd.style.cursor = "ns-resize"; // Vertical resize cursor for dot
        } else {            
            this.dotStart.setAttribute("fill", "blue");
            this.dotEnd.setAttribute("fill", "blue");           
            this.dotStart.style.cursor = "pointer";
            this.dotEnd.style.cursor = "pointer";
        }
    }
}
