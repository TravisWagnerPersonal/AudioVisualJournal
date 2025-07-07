// ===== Global App State =====
let db = null;
let currentEntry = null;
let allEntries = [];
let searchTerm = '';
let currentView = 'timeline';
let isGridView = false;

// ===== Database Configuration =====
const DB_NAME = 'AudioPhotoJournal';
const DB_VERSION = 1;
const STORES = {
    entries: 'entries',
    photos: 'photos',
    audio: 'audio'
};

// ===== App Initialization =====
async function initializeApp() {
    console.log('🚀 Initializing Audio-Photo Journal App...');
    
    try {
        // Initialize database
        await initDatabase();
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        await loadAllEntries();
        
        // Hide loading screen and show app
        hideLoadingScreen();
        
        // Render initial view
        renderTimeline();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showError('Failed to initialize app. Please refresh the page.');
    }
}

// ===== Database Operations =====
function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            console.log('📀 Database connected');
            resolve();
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('🔧 Creating database schema...');
            
            // Create entries store
            if (!db.objectStoreNames.contains(STORES.entries)) {
                const entriesStore = db.createObjectStore(STORES.entries, { 
                    keyPath: 'id', 
                    autoIncrement: false 
                });
                entriesStore.createIndex('dateCreated', 'dateCreated', { unique: false });
                entriesStore.createIndex('title', 'title', { unique: false });
                entriesStore.createIndex('mood', 'mood', { unique: false });
                entriesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            }
            
            // Create photos store
            if (!db.objectStoreNames.contains(STORES.photos)) {
                db.createObjectStore(STORES.photos, { 
                    keyPath: 'id', 
                    autoIncrement: false 
                });
            }
            
            // Create audio store
            if (!db.objectStoreNames.contains(STORES.audio)) {
                db.createObjectStore(STORES.audio, { 
                    keyPath: 'id', 
                    autoIncrement: false 
                });
            }
        };
    });
}

async function saveEntry(entry) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.entries], 'readwrite');
        const store = transaction.objectStore(STORES.entries);
        
        // Ensure entry has required properties
        if (!entry.id) {
            entry.id = generateId();
        }
        if (!entry.dateCreated) {
            entry.dateCreated = new Date().toISOString();
        }
        entry.dateModified = new Date().toISOString();
        
        const request = store.put(entry);
        request.onsuccess = () => {
            console.log('💾 Entry saved:', entry.id);
            resolve(entry);
        };
        request.onerror = () => reject(request.error);
    });
}

async function getEntry(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.entries], 'readonly');
        const store = transaction.objectStore(STORES.entries);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteEntry(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.entries], 'readwrite');
        const store = transaction.objectStore(STORES.entries);
        const request = store.delete(id);
        
        request.onsuccess = () => {
            console.log('🗑️ Entry deleted:', id);
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

async function getAllEntries() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.entries], 'readonly');
        const store = transaction.objectStore(STORES.entries);
        const index = store.index('dateCreated');
        const request = index.getAll();
        
        request.onsuccess = () => {
            const entries = request.result.sort((a, b) => 
                new Date(b.dateCreated) - new Date(a.dateCreated)
            );
            resolve(entries);
        };
        request.onerror = () => reject(request.error);
    });
}

async function saveMediaFile(file, type) {
    return new Promise((resolve, reject) => {
        const storeName = type === 'photo' ? STORES.photos : STORES.audio;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const mediaData = {
            id: generateId(),
            file: file,
            type: type,
            dateCreated: new Date().toISOString()
        };
        
        const request = store.put(mediaData);
        request.onsuccess = () => {
            console.log(`📎 ${type} saved:`, mediaData.id);
            resolve(mediaData.id);
        };
        request.onerror = () => reject(request.error);
    });
}

async function getMediaFile(id, type) {
    return new Promise((resolve, reject) => {
        const storeName = type === 'photo' ? STORES.photos : STORES.audio;
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ===== Data Management =====
async function loadAllEntries() {
    try {
        allEntries = await getAllEntries();
        console.log(`📚 Loaded ${allEntries.length} entries`);
    } catch (error) {
        console.error('Failed to load entries:', error);
        allEntries = [];
    }
}

function filterEntries() {
    if (!searchTerm) return allEntries;
    
    const term = searchTerm.toLowerCase();
    return allEntries.filter(entry => 
        entry.title?.toLowerCase().includes(term) ||
        entry.content?.toLowerCase().includes(term) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(term))
    );
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            if (view && view !== 'create') {
                navigateToView(view);
            }
        });
    });
    
    // Header buttons
    document.getElementById('search-btn').addEventListener('click', toggleSearch);
    document.getElementById('search-close').addEventListener('click', closeSearch);
    document.getElementById('search-input').addEventListener('input', handleSearch);
    
    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            toggleViewMode(view);
        });
    });
    
    // Create/Edit form
    document.getElementById('cancel-create').addEventListener('click', () => navigateToView('timeline'));
    document.getElementById('save-entry').addEventListener('click', handleSaveEntry);
    
    // Detail view
    document.getElementById('back-to-timeline').addEventListener('click', () => navigateToView('timeline'));
    document.getElementById('edit-entry').addEventListener('click', handleEditEntry);
    
    // Mood selector
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
        });
    });
    
    // Prevent default form submission
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
    
    console.log('🎧 Event listeners setup complete');
}

// ===== Navigation =====
function navigateToView(viewName) {
    // Update navigation state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
    
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show target view
    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
        
        // View-specific actions
        switch (viewName) {
            case 'timeline':
                renderTimeline();
                break;
            case 'create':
                resetCreateForm();
                break;
        }
    }
}

function showCreateEntry() {
    currentEntry = null;
    navigateToView('create');
    document.getElementById('create-title').textContent = 'New Entry';
}

function showEditEntry(entry) {
    currentEntry = entry;
    navigateToView('create');
    document.getElementById('create-title').textContent = 'Edit Entry';
    populateCreateForm(entry);
}

function showEntryDetail(entry) {
    currentEntry = entry;
    renderEntryDetail(entry);
    navigateToView('detail');
}

// ===== Search Functionality =====
function toggleSearch() {
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    
    if (searchContainer.classList.contains('hidden')) {
        searchContainer.classList.remove('hidden');
        searchInput.focus();
    } else {
        closeSearch();
    }
}

function closeSearch() {
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    
    searchContainer.classList.add('hidden');
    searchInput.value = '';
    searchTerm = '';
    renderTimeline();
}

function handleSearch(e) {
    searchTerm = e.target.value;
    renderTimeline();
}

// ===== View Rendering =====
function renderTimeline() {
    const container = document.getElementById('entries-container');
    const emptyState = document.getElementById('empty-state');
    const filteredEntries = filterEntries();
    
    if (filteredEntries.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = filteredEntries.map(entry => createEntryCard(entry)).join('');
    
    // Add click listeners to entry cards
    container.querySelectorAll('.entry-card').forEach((card, index) => {
        card.addEventListener('click', () => showEntryDetail(filteredEntries[index]));
    });
}

function createEntryCard(entry) {
    const date = new Date(entry.dateCreated).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const time = new Date(entry.dateCreated).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    const mood = entry.mood ? getMoodEmoji(entry.mood) : '';
    const hasPhoto = entry.photoIds && entry.photoIds.length > 0;
    const hasAudio = entry.audioId;
    const tags = entry.tags || [];
    
    return `
        <div class="entry-card ${isGridView ? 'grid-view' : ''}">
            <div class="entry-header">
                <div class="entry-title">${escapeHtml(entry.title || 'Untitled')}</div>
                <div class="entry-date">
                    ${date} at ${time}
                    ${mood ? `<span class="entry-mood">${mood}</span>` : ''}
                </div>
            </div>
            ${hasPhoto ? `<div class="entry-media">
                <div class="entry-photo" style="background-image: url(${entry.photoPreview}); height: 160px; background-size: cover; background-position: center;"></div>
            </div>` : ''}
            <div class="entry-content">
                ${entry.content ? `<div class="entry-text">${escapeHtml(entry.content)}</div>` : ''}
                ${hasAudio ? `<div class="entry-audio-indicator">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    </svg>
                    Audio recording
                </div>` : ''}
                ${tags.length > 0 ? `<div class="entry-tags">
                    ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>` : ''}
            </div>
        </div>
    `;
}

function renderEntryDetail(entry) {
    const container = document.getElementById('detail-content');
    const date = new Date(entry.dateCreated).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const time = new Date(entry.dateCreated).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
    
    const mood = entry.mood ? getMoodEmoji(entry.mood) : '';
    const tags = entry.tags || [];
    
    container.innerHTML = `
        <div class="detail-header-info">
            <h1>${escapeHtml(entry.title || 'Untitled')}</h1>
            <div class="detail-date">${date} at ${time} ${mood}</div>
        </div>
        
        ${entry.photoIds && entry.photoIds.length > 0 ? `
            <div class="detail-photos">
                ${entry.photoIds.map(photoId => `
                    <img src="${entry.photoPreview}" alt="Journal photo" class="detail-photo">
                `).join('')}
            </div>
        ` : ''}
        
        ${entry.audioId ? `
            <div class="detail-audio">
                <div class="audio-player">
                    <button class="audio-play-btn" onclick="playAudio('${entry.audioId}')">▶</button>
                    <div class="audio-info">
                        <div class="audio-duration">Audio recording</div>
                        <div class="audio-waveform">
                            <div class="audio-progress" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}
        
        ${entry.content ? `
            <div class="detail-content-text">
                <h3>Notes</h3>
                <p>${escapeHtml(entry.content).replace(/\n/g, '<br>')}</p>
            </div>
        ` : ''}
        
        ${tags.length > 0 ? `
            <div class="detail-tags">
                <h3>Tags</h3>
                <div class="tags-list">
                    ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

function toggleViewMode(mode) {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });
    
    isGridView = mode === 'grid';
    renderTimeline();
}

// ===== Form Handling =====
function resetCreateForm() {
    document.getElementById('entry-title').value = '';
    document.getElementById('entry-content').value = '';
    document.getElementById('entry-tags').value = '';
    document.getElementById('photo-preview').innerHTML = '';
    document.getElementById('audio-preview').innerHTML = '';
    
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    currentEntry = null;
}

function populateCreateForm(entry) {
    document.getElementById('entry-title').value = entry.title || '';
    document.getElementById('entry-content').value = entry.content || '';
    document.getElementById('entry-tags').value = entry.tags ? entry.tags.join(', ') : '';
    
    // Set mood
    if (entry.mood) {
        const moodBtn = document.querySelector(`[data-mood="${entry.mood}"]`);
        if (moodBtn) {
            document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
            moodBtn.classList.add('selected');
        }
    }
    
    // TODO: Populate photo and audio previews
}

async function handleSaveEntry() {
    try {
        const title = document.getElementById('entry-title').value.trim();
        const content = document.getElementById('entry-content').value.trim();
        const tagsInput = document.getElementById('entry-tags').value.trim();
        const selectedMood = document.querySelector('.mood-btn.selected');
        
        if (!title && !content) {
            showError('Please add a title or some content to your entry.');
            return;
        }
        
        const entry = {
            id: currentEntry?.id || generateId(),
            title: title,
            content: content,
            mood: selectedMood?.dataset.mood || null,
            tags: tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            photoIds: [], // TODO: Implement photo handling
            audioId: null, // TODO: Implement audio handling
            dateCreated: currentEntry?.dateCreated || new Date().toISOString(),
            dateModified: new Date().toISOString()
        };
        
        await saveEntry(entry);
        await loadAllEntries();
        
        showSuccess(currentEntry ? 'Entry updated successfully!' : 'Entry saved successfully!');
        navigateToView('timeline');
        
    } catch (error) {
        console.error('Failed to save entry:', error);
        showError('Failed to save entry. Please try again.');
    }
}

function handleEditEntry() {
    if (currentEntry) {
        showEditEntry(currentEntry);
    }
}

// ===== Utility Functions =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getMoodEmoji(mood) {
    const moodEmojis = {
        happy: '😊',
        sad: '😢',
        excited: '🤩',
        calm: '😌',
        anxious: '😰',
        grateful: '🙏'
    };
    return moodEmojis[mood] || '';
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.getElementById('app').style.display = 'flex';
        }, 500);
    }, 1000);
}

function showError(message) {
    // TODO: Implement proper error toast
    alert('Error: ' + message);
}

function showSuccess(message) {
    // TODO: Implement proper success toast
    console.log('Success: ' + message);
}

// ===== Export for global use =====
window.showCreateEntry = showCreateEntry;
window.showEditEntry = showEditEntry;
window.showEntryDetail = showEntryDetail;
window.initializeApp = initializeApp; 