# Servo Tester Interface

A web-based interface for programming and testing servo motors with an intuitive visual timeline. Create smooth servo motion sequences using interactive Bezier curves, manage multiple servos, and save your configurations.

## Application Access
The application is available at: [https://atzo.github.io/ServoTesterInterface/](https://atzo.github.io/ServoTesterInterface/)

### Browser Compatibility
- **Google Chrome/Edge (Recommended)**
  - Full support for all features
  - Best performance and stability
  - Complete Web Serial and Web Bluetooth API support
- **Firefox**
  - Limited functionality
  - No Web Serial API support (USB connection not available)
  - Web Bluetooth API support varies by version
- **Safari**
  - Limited functionality
  - No Web Serial API support
  - No Web Bluetooth API support
  - Not recommended for use

Note: The application is fully functional except for the hardware connection features (USB and Bluetooth) which are currently under development. Browser support for these features may improve in future browser versions.

## Development Status

⚠️ **This project is currently in active development** ⚠️

The interface is functional but may undergo significant changes as development continues. New features and improvements are being added regularly.

### Missing Components
The following interface components are currently under development:
- Bluetooth connection implementation

## Hardware Integration

This project is part of a larger system that includes a microcontroller-based hardware component for servo control. The hardware component:
- Supports multiple servo control protocols
- Can handle multiple servos simultaneously
- Provides real-time servo position control
- Manages hardware-level servo operations

## Key Features
- Visual timeline editor with Bezier curve interpolation
- Support for up to 16 servos with individual controls
- Real-time motion path editing with draggable control points
- Project save/load functionality with auto-save
- USB and Bluetooth connectivity options
- Browser-based - no installation required
- Timeline scrubber for animation preview and control
- Output type selection (PWM or PCA9685)
  - PWM: Direct PWM output from the Arduino board
  - PCA9685: External board connected via I2C for expanded servo control

## Technologies
- Pure JavaScript for core functionality
- SVG for timeline visualization
- Web Serial API for USB connections
- Web Bluetooth API for wireless connections
- JSON for project data storage

## Features

### 🎯 Core Functionality
- Interactive timeline interface for servo motion control
- Support for multiple servos (up to 16)
- Visual Bezier curve editing for smooth motion paths
- Real-time servo position preview
- USB and Bluetooth connectivity options
- Timeline scrubber for animation playback and testing

### 🎨 Timeline Controls
- Drag-and-drop keyframe positioning
- Adjustable control points for Bezier curves
- Visual feedback for motion paths
- Base frame adjustment for initial positions
- Arrow key support for fine-tuning
- Play/pause controls for animation testing
- Time slider for manual position control

### 💾 Project Management
- Save/Load projects as JSON files
- Auto-save functionality
- New project creation
- Individual servo configuration

### ⚙️ Servo Configuration
- Custom naming for servos
- Show/Hide in control panel
- Loop/Single motion type toggle
- Position limits (min/max)
- Visual indicators

### 🔧 Technical Features
- SVG-based timeline visualization
- Responsive design
- Real-time updates
- Event-driven architecture
- Modular code structure
- Precalculated animation values for smooth playback

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ServoTesterInterface.git
```

2. Open `index.html` in a modern web browser that supports:
   - Web Serial API (for USB connections)
   - Web Bluetooth API (for Bluetooth connections)
   - Modern JavaScript features
   - SVG manipulation

### Local Development Server

⚠️ **Important**: When running the project locally, you must use a local web server due to Web Serial API security requirements. Opening the HTML file directly (`file://` protocol) will not allow Web Serial connections.

You can use any of these methods to start a local server:

#### Using Node.js
```bash
# Install a simple HTTP server
npm install -g http-server

# Start the server in the project directory
http-server
```

#### Using Python
```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

#### Using Apache
If you have Apache installed, you can configure it to serve the project directory.

#### Using Visual Studio Code
If you're using VS Code, you can install the "Live Server" extension and click "Go Live" to start a local server.

After starting a local server, access the application at `http://localhost:8000` (or the port specified by your server).

## Project Structure

```
ServoTesterInterface/
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── baseframe.js        # Base frame functionality
│   ├── constants.js        # Global constants
│   ├── keyframe.js         # Keyframe management
│   ├── main.js             # Main application entry
│   ├── motionpath.js       # Motion path and Bezier curves
│   ├── script.js           # Additional scripts
│   ├── servoManager.js     # Servo control and management
│   ├── timeline.js         # Timeline visualization
│   ├── timelineScrubber.js # Animation playback control
│   └── webserial.js        # USB serial communication
├── .gitignore              # Git ignore rules
├── index.html              # Main application
├── LICENSE                 # License information
├── README.md               # Project documentation
└── timeline.html           # Timeline testing page
```

## Usage

1. **Connection Setup**
   - Use the USB or Bluetooth connection buttons to connect to your servo controller
   - Ensure your device supports the required connection method

2. **Servo Configuration**
   - Set the number of servos (1-16)
   - Configure each servo's name, type, and limits
   - Toggle servo visibility in the control panel

3. **Motion Programming**
   - Double-click on the timeline to add keyframes
   - Drag keyframes to adjust timing and position
   - Use control points to shape the motion path
   - Adjust the base frame for initial positions

4. **Project Management**
   - Save your project using the Save button
   - Load existing projects using the Load button
   - Start fresh with the New Project button
   - Projects are auto-saved to prevent data loss

## Technical Details

- Timeline coordinates use a 0-100 scale for position (x-axis)
- Servo angles range from 0-180 degrees (y-axis)
- Motion paths use cubic Bezier curves for smooth interpolation
- Relative control point positions ensure consistent motion when keyframes move
- SVG-based visualization provides precise control and smooth rendering

## Browser Compatibility

- Chrome/Edge (recommended) - Full support for Web Serial and Web Bluetooth
- Firefox - Limited support (no Web Serial)
- Safari - Limited support (no Web Serial/Bluetooth)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 