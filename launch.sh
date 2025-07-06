#!/bin/bash

# Audio-Photo Journal Web App Launcher
echo "🚀 Starting Audio-Photo Journal Web App..."

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "📱 Using Python 3 to serve the app..."
    echo "🌐 Open your browser and go to: http://localhost:8000"
    echo "📱 For mobile testing, use your computer's IP address"
    echo "⏹️  Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "📱 Using Python to serve the app..."
    echo "🌐 Open your browser and go to: http://localhost:8000"
    echo "📱 For mobile testing, use your computer's IP address"
    echo "⏹️  Press Ctrl+C to stop the server"
    echo ""
    python -m SimpleHTTPServer 8000
elif command -v node &> /dev/null; then
    echo "📱 Using Node.js to serve the app..."
    echo "🌐 Open your browser and go to: http://localhost:8000"
    echo "📱 For mobile testing, use your computer's IP address"
    echo "⏹️  Press Ctrl+C to stop the server"
    echo ""
    npx serve . -p 8000
else
    echo "❌ No suitable web server found."
    echo "📋 Please install one of the following:"
    echo "   • Python 3: python3 -m http.server 8000"
    echo "   • Python 2: python -m SimpleHTTPServer 8000"
    echo "   • Node.js: npx serve . -p 8000"
    echo "   • Any other static file server"
    echo ""
    echo "🌐 Then open http://localhost:8000 in your browser"
fi 