# 📱 Audio-Photo Journal Web App

A beautiful, feature-rich Progressive Web App (PWA) for journaling with audio recordings, photos, and text. Built with modern web technologies to provide a native app experience on any device.

## 🌟 Features

### Core Functionality
- ✍️ **Rich Text Journaling** - Write your thoughts with a beautiful, distraction-free interface
- 🎤 **Audio Recording** - Record voice notes with high-quality audio capture
- 📷 **Photo Integration** - Capture or select photos to enhance your entries
- 😊 **Mood Tracking** - Track your emotional state with each entry
- 🏷️ **Tags & Organization** - Organize entries with custom tags
- 🔍 **Advanced Search** - Find entries by title, content, tags, or mood
- 📍 **Location Context** - Automatically capture location data (optional)

### Modern Web App Features
- 📱 **Progressive Web App** - Install like a native app on any device
- 🔄 **Offline Support** - Works without internet connection
- 💾 **Local Storage** - All data stored securely on your device
- 🎨 **Native iOS Design** - Beautiful interface that feels like a native iOS app
- 🌓 **Dark Mode Support** - Automatic dark mode based on system preferences
- ♿ **Accessibility** - Full VoiceOver and keyboard navigation support

### Privacy & Security
- 🔒 **100% Private** - All data stays on your device
- 🚫 **No Tracking** - No analytics, ads, or data collection
- 🛡️ **Secure Storage** - Encrypted local storage using IndexedDB
- 🔐 **Optional Biometric** - Use Face ID/Touch ID for app access (when available)

## 🚀 Getting Started

### Installation Options

#### Option 1: Install as PWA (Recommended)
1. Open the web app in your browser
2. Look for the "Install" button in your browser's address bar
3. Click "Install" to add it to your home screen
4. The app will now work like a native app!

#### Option 2: Add to Home Screen (iOS Safari)
1. Open the web app in Safari on iOS
2. Tap the Share button (□ with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add" to confirm

#### Option 3: Use in Browser
Simply bookmark the web app and use it directly in your browser.

### First Launch
1. **Grant Permissions** (optional but recommended):
   - 🎤 Microphone access for audio recordings
   - 📷 Camera access for taking photos
   - 📍 Location access for context
   
2. **Create Your First Entry**:
   - Tap the "+" button to start
   - Add a title, take a photo, record audio, or just write
   - Save your entry

## 🎯 Usage Guide

### Creating Entries

#### Text Entries
1. Tap the "+" button or "Create" in the bottom navigation
2. Add a title (optional but recommended)
3. Write your thoughts in the content area
4. Select your mood (optional)
5. Add tags separated by commas (optional)
6. Tap "Save"

#### Audio Entries
1. Start creating a new entry
2. In the Audio section, tap "Tap to Record"
3. Speak your thoughts (the app will record high-quality audio)
4. Tap again to stop recording
5. You can play back your recording before saving
6. Add any additional text or photos
7. Tap "Save"

#### Photo Entries
1. Start creating a new entry
2. In the Photos section, choose:
   - "Take Photo" to use your camera
   - "Choose Photo" to select from your gallery
3. You can add multiple photos
4. Add a title or description
5. Tap "Save"

### Organizing Entries

#### Using Tags
- Add tags like "travel", "work", "family", "dreams" when creating entries
- Tags help you find related entries quickly
- Use the search feature to filter by tags

#### Mood Tracking
- Select an emoji that represents your mood
- View patterns in your emotional journey over time
- Search entries by specific moods

#### Search & Filter
- Use the search icon in the top bar
- Search by title, content, tags, or any text
- Results update in real-time as you type

### Managing Your Data

#### Viewing Entries
- **Timeline View**: See all entries in chronological order
- **Grid View**: Compact view showing entry previews
- **Detail View**: Full view of a single entry with all media

#### Editing Entries
1. Tap any entry to view it
2. Tap "Edit" in the top-right corner
3. Make your changes
4. Tap "Save" to update

#### Backup & Export
- All data is stored locally on your device
- Use your device's backup system (iCloud, Google Backup, etc.)
- Manual export features coming soon

## 🛠️ Technical Details

### Browser Compatibility
- **Recommended**: Safari on iOS, Chrome on Android
- **Supported**: All modern browsers with ES2020 support
- **Audio Recording**: Requires browsers with MediaRecorder API support
- **Camera**: Requires browsers with MediaDevices API support

### Storage
- **Database**: IndexedDB for structured data storage
- **Media Files**: Blob storage for photos and audio
- **Settings**: LocalStorage for app preferences
- **Capacity**: Limited by device storage (typically 50MB+ available)

### Offline Functionality
- ✅ View existing entries
- ✅ Create new entries
- ✅ Edit entries
- ✅ Record audio
- ✅ Take photos
- ❌ Sync across devices (local only)

### Performance Optimizations
- Lazy loading of images
- Audio compression
- Efficient database queries
- Service Worker caching
- Memory management for media files

## 🔧 Development

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES2020+), HTML5, CSS3
- **Storage**: IndexedDB API
- **Audio**: Web Audio API, MediaRecorder API
- **Camera**: MediaDevices API
- **PWA**: Service Worker, Web App Manifest
- **Styling**: Native iOS design patterns with CSS Grid/Flexbox

### Local Development
1. Clone or download the project files
2. Serve the files using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using any other static server
   ```
3. Open `http://localhost:8000` in your browser
4. Start developing!

### File Structure
```
AudioPhotoJournal_WebApp/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── app.js             # Core app logic & navigation
├── journal.js         # Journal management
├── audio.js           # Audio recording & playback
├── camera.js          # Camera & photo management
├── sw.js              # Service Worker
├── manifest.json      # PWA manifest
├── cache.manifest     # Cache manifest
└── README.md          # This file
```

## 🤝 Contributing

This is an open-source project. Contributions are welcome!

### Areas for Improvement
- Additional export formats (PDF, EPUB)
- Cloud sync options
- Advanced search filters
- Themes and customization
- Voice-to-text transcription
- Scheduled reminders
- Data visualization

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

### Troubleshooting

**App won't record audio:**
- Check microphone permissions in browser settings
- Ensure you're using a supported browser
- Try refreshing the page

**Camera not working:**
- Check camera permissions in browser settings
- Ensure you're using HTTPS (required for camera access)
- Try a different browser

**Data not saving:**
- Check if you have sufficient storage space
- Try clearing browser cache and reloading
- Ensure JavaScript is enabled

**App feels slow:**
- Check available device storage
- Close other browser tabs
- Restart your browser

### Getting Help
- Check browser console for error messages (F12 → Console)
- Try using the app in an incognito/private window
- Update your browser to the latest version

## 🔮 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Voice-to-text transcription
- [ ] Entry templates
- [ ] Export to PDF/text
- [ ] Enhanced search filters
- [ ] Statistics and insights

### Version 1.2 (Future)
- [ ] Optional cloud sync
- [ ] Collaborative journaling
- [ ] Scheduled reminders
- [ ] Advanced customization
- [ ] Desktop companion app

---

**Made with ❤️ for people who want to capture and preserve their memories in a beautiful, private way.**
