// ============================================
// Stocks by PirateRuler.com - Premium Application
// Production-Ready JavaScript with Modern Architecture
// ============================================

// Configuration
const CONFIG = {
    PEXELS_API_KEY: 'sCGpOigHSBn3xjOTedMS977vcjXS3bguZuxGIvj6f39tT6LF1xNFkxh3',
    PEXELS_PHOTO_URL: 'https://api.pexels.com/v1/search',
    PEXELS_VIDEO_URL: 'https://api.pexels.com/videos/search',
    PER_PAGE: 40,
    MAX_PAGES: 50,
    CACHE_DURATION: 300000, // 5 minutes
};

// State Management
class StateManager {
    constructor() {
        this.state = {
            currentQuery: '',
            currentType: 'all',
            currentPage: 1,
            isLoading: false,
            favorites: this.loadFavorites(),
            sidebarOpen: false,
            modalOpen: false,
            currentMedia: null,
            selectedCategory: null,
            selectedCountry: null,
            darkMode: localStorage.getItem('darkMode') !== 'false',
        };
    }

    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch {
            return [];
        }
    }

    saveFavorites() {
        localStorage.setItem('favorites', JSON.stringify(this.state.favorites));
    }

    setState(key, value) {
        this.state[key] = value;
        this.emit('statechange', { key, value });
    }

    on(event, callback) {
        this.events = this.events || {};
        this.events[event] = this.events[event] || [];
        this.events[event].push(callback);
    }

    emit(event, data) {
        if (this.events && this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
}

// API Service
class APIService {
    constructor() {
        this.cache = new Map();
    }

    getCacheKey(query, type, page) {
        return `${query}-${type}-${page}`;
    }

    isCached(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        if (Date.now() - cached.timestamp > CONFIG.CACHE_DURATION) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }

    async fetchWithRetry(url, options, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
    }

    async search(query, type = 'all', page = 1) {
        const cacheKey = this.getCacheKey(query, type, page);
        
        // Check cache first
        if (this.isCached(cacheKey)) {
            console.log('Serving from cache:', cacheKey);
            return this.cache.get(cacheKey).data;
        }

        const headers = {
            'Authorization': CONFIG.PEXELS_API_KEY,
            'Content-Type': 'application/json',
        };

        const promises = [];
        
        if (type === 'photos' || type === 'all') {
            const photoUrl = `${CONFIG.PEXELS_PHOTO_URL}?q=${encodeURIComponent(query)}&per_page=${CONFIG.PER_PAGE}&page=${page}`;
            promises.push(
                this.fetchWithRetry(photoUrl, { headers })
                    .then(r => r.json())
                    .then(data => data.photos || [])
            );
        }

        if (type === 'videos' || type === 'all') {
            const videoUrl = `${CONFIG.PEXELS_VIDEO_URL}?query=${encodeURIComponent(query)}&per_page=${30}&page=${page}`;
            promises.push(
                this.fetchWithRetry(videoUrl, { headers })
                    .then(r => r.json())
                    .then(data => (data.videos || []).map(v => ({ ...v, type: 'video' })))
            );
        }

        try {
            const [photos = [], videos = []] = await Promise.all(promises);
            const combined = [...photos, ...videos];
            
            // Shuffle results for randomness
            const shuffled = this.shuffleArray(combined);
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: shuffled,
                timestamp: Date.now(),
            });

            return shuffled;
        } catch (error) {
            console.error('API fetch error:', error);
            // If all fails, return empty array
            return [];
        }
    }

    shuffleArray(array) {
        const seed = this.generateSeed();
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.seededRandom(seed + i) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    generateSeed() {
        return Date.now() + Math.random();
    }

    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    async downloadMedia(url) {
        try {
            // Try to download directly
            const link = document.createElement('a');
            link.href = url;
            link.download = '';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            // If CORS blocked, open in new tab
            window.open(url, '_blank');
        }
    }
}

// UI Manager
class UIManager {
    constructor(stateManager, apiService) {
        this.state = stateManager;
        this.api = apiService;
        this.grid = document.getElementById('media-grid');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search
        const searchForm = document.querySelector('.search-form');
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = e.target.querySelector('.search-input').value.trim();
            if (query) this.handleNewSearch(query);
        });

        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => this.handleFilterChip(chip));
        });
    }

    handleNewSearch(query) {
        this.state.setState('currentQuery', query);
        this.state.setState('currentPage', 1);
        this.clearGrid();
        this.loadMedia();
    }

    handleFilterChip(chip) {
        // Update active state
        const isPrimary = chip.dataset.type;
        const selector = isPrimary ? '.primary-filters .filter-chip' : '.secondary-filters .filter-chip';
        
        document.querySelectorAll(selector).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        // Handle different chip types
        if (chip.dataset.type) {
            this.state.setState('currentType', chip.dataset.type);
        } else if (chip.dataset.category) {
            this.state.setState('currentQuery', chip.dataset.category);
        }

        this.state.setState('currentPage', 1);
        this.clearGrid();
        this.loadMedia();
    }

    clearGrid() {
        this.grid.innerHTML = '';
    }

    async loadMedia() {
        if (this.state.state.isLoading) return;

        this.state.setState('isLoading', true);
        this.showLoading(true);

        try {
            const media = await this.api.search(
                this.state.state.currentQuery,
                this.state.state.currentType,
                this.state.state.currentPage
            );

            // If no results, retry with random category
            if (media.length === 0 && this.state.state.currentPage === 1) {
                const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
                this.state.setState('currentQuery', randomCategory);
                const retryMedia = await this.api.search(randomCategory, this.state.state.currentType, 1);
                this.renderMedia(retryMedia);
            } else {
                this.renderMedia(media);
            }

            this.state.setState('currentPage', this.state.state.currentPage + 1);
        } catch (error) {
            console.error('Load media error:', error);
        } finally {
            this.state.setState('isLoading', false);
            this.showLoading(false);
        }
    }

    renderMedia(mediaItems) {
        const fragment = document.createDocumentFragment();

        mediaItems.forEach(item => {
            const card = this.createMediaCard(item);
            fragment.appendChild(card);
        });

        this.grid.appendChild(fragment);
    }

    createMediaCard(item) {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.dataset.id = item.id;
        card.dataset.type = item.type || 'photo';

        const isVideo = item.type === 'video';
        const url = isVideo ? item.video_files[0]?.link : item.src?.original;
        const thumbUrl = isVideo ? item.video_pictures[0]?.picture : item.src?.medium;
        const resolution = isVideo ? `${item.width}x${item.height}` : `${item.width}x${item.height}`;

        card.innerHTML = `
            ${isVideo ? 
                `<video src="${url}" muted loop class="media-thumb" loading="lazy"></video>` :
                `<img src="${thumbUrl}" alt="${item.alt || 'Stock media'}" class="media-thumb" loading="lazy">`
            }
            <div class="media-overlay">
                <button class="overlay-btn download-btn" aria-label="Download media">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                </button>
                <button class="overlay-btn favorite-btn ${this.isFavorited(item.id) ? 'favorited' : ''}" 
                        aria-label="Toggle favorite">
                    <svg class="heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="${this.isFavorited(item.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                </button>
            </div>
            <div class="media-badge">${isVideo ? 'Video' : 'Photo'}</div>
        `;

        // Event listeners
        card.addEventListener('click', (e) => {
            if (e.target.closest('.overlay-btn')) return;
            this.openModal(item);
        });

        card.querySelector('.download-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleDownload(url, item);
        });

        card.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(item, card);
        });

        return card;
    }

    isFavorited(id) {
        return this.state.state.favorites.some(fav => fav.id === id);
    }

    toggleFavorite(item, card) {
        const favorites = [...this.state.state.favorites];
        const index = favorites.findIndex(fav => fav.id === item.id);
        
        if (index > -1) {
            favorites.splice(index, 1);
            card.querySelector('.favorite-btn').classList.remove('favorited');
        } else {
            favorites.push({
                id: item.id,
                type: item.type || 'photo',
                url: item.src?.original || item.video_files[0]?.link,
                thumb: item.src?.medium || item.video_pictures[0]?.picture,
                photographer: item.photographer,
                width: item.width,
                height: item.height,
                alt: item.alt || 'Stock media',
            });
            card.querySelector('.favorite-btn').classList.add('favorited');
        }

        this.state.setState('favorites', favorites);
        this.state.saveFavorites();
        this.updateFavoritesCount();
    }

    updateFavoritesCount() {
        const count = this.state.state.favorites.length;
        const countEl = document.querySelector('.favorites-count');
        if (countEl) {
            countEl.textContent = `${count} item${count !== 1 ? 's' : ''} saved`;
        }
    }

    openModal(item) {
        this.state.setState('currentMedia', item);
        const modal = document.getElementById('preview-modal');
        
        // Populate modal
        const isVideo = item.type === 'video';
        const url = isVideo ? item.video_files[0]?.link : item.src?.original;
        
        modal.querySelector('.modal-image').style.display = isVideo ? 'none' : 'block';
        modal.querySelector('.modal-video').style.display = isVideo ? 'block' : 'none';
        
        if (isVideo) {
            modal.querySelector('.modal-video').src = url;
        } else {
            modal.querySelector('.modal-image').src = url;
            modal.querySelector('.modal-image').alt = item.alt || 'Stock media';
        }

        modal.querySelector('.modal-title').textContent = item.alt || 'Untitled Asset';
        modal.querySelector('.modal-photographer').textContent = `By ${item.photographer || 'Unknown'}`;
        modal.querySelector('.modal-resolution').textContent = `${item.width}x${item.height}px`;
        
        const attribution = isVideo ? 
            `Video by ${item.photographer} on Pexels` :
            `Photo by ${item.photographer} on Pexels`;
        modal.querySelector('.modal-attribution').textContent = attribution;

        // Update favorite button
        const favoriteBtn = modal.querySelector('.favorite-btn');
        favoriteBtn.classList.toggle('favorited', this.isFavorited(item.id));
        
        favoriteBtn.onclick = () => {
            const card = document.querySelector(`[data-id="${item.id}"]`);
            this.toggleFavorite(item, card);
            favoriteBtn.classList.toggle('favorited', this.isFavorited(item.id));
        };

        // Download button
        modal.querySelector('.download-btn').onclick = () => this.handleDownload(url, item);

        modal.showModal();
        this.state.setState('modalOpen', true);
    }

    handleDownload(url, item) {
        this.api.downloadMedia(url);
    }

    showLoading(show) {
        this.loadingIndicator.setAttribute('aria-hidden', !show);
    }
}

// Infinite Scroll Manager
class InfiniteScrollManager {
    constructor(stateManager, uiManager) {
        this.state = stateManager;
        this.ui = uiManager;
        this.setupObserver();
    }

    setupObserver() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.state.state.isLoading) {
                        this.ui.loadMedia();
                    }
                });
            },
            {
                root: null,
                rootMargin: '200px',
                threshold: 0.1,
            }
        );

        // Create sentinel element
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'scroll-sentinel';
        this.sentinel.style.height = '1px';
        this.sentinel.style.width = '100%';
        observer.observe(this.sentinel);
        
        // Add to grid container
        this.ui.grid.parentNode.appendChild(this.sentinel);
    }
}

// Modal Manager
class ModalManager {
    constructor(stateManager) {
        this.state = stateManager;
        this.modal = document.getElementById('preview-modal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close modal
        this.modal.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.state.modalOpen) {
                this.closeModal();
            }
        });

        // Swipe to close
        let touchStartY = 0;
        this.modal.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });

        this.modal.addEventListener('touchmove', (e) => {
            if (!touchStartY) return;
            const touchEndY = e.touches[0].clientY;
            const diff = touchStartY - touchEndY;
            
            if (diff < -100) { // Swipe down
                this.closeModal();
            }
        });
    }

    closeModal() {
        this.modal.close();
        this.state.setState('modalOpen', false);
        this.state.setState('currentMedia', null);
        
        // Stop any playing videos
        const video = this.modal.querySelector('.modal-video');
        if (video) {
            video.pause();
            video.src = '';
        }
    }
}

// Sidebar Manager
class SidebarManager {
    constructor(stateManager, uiManager) {
        this.state = stateManager;
        this.ui = uiManager;
        this.sidebar = document.getElementById('sidebar');
        this.setupEventListeners();
        this.setupLists();
    }

    setupEventListeners() {
        // Hamburger toggle
        document.querySelector('.hamburger').addEventListener('click', () => this.toggleSidebar());
        
        // Close sidebar
        this.sidebar.querySelectorAll('[data-close-sidebar]').forEach(btn => {
            btn.addEventListener('click', () => this.closeSidebar());
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.state.sidebarOpen) {
                this.closeSidebar();
            }
        });

        // Dark mode toggle
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.state.setState('darkMode', e.target.checked);
            localStorage.setItem('darkMode', e.target.checked);
        });

        // Clear cache
        document.querySelector('.clear-cache-btn').addEventListener('click', () => {
            localStorage.clear();
            location.reload();
        });

        // View favorites
        document.querySelector('.view-favorites-btn').addEventListener('click', () => {
            this.showFavoritesGrid();
            this.closeSidebar();
        });
    }

    toggleSidebar() {
        const isOpen = this.state.state.sidebarOpen;
        if (isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        this.sidebar.setAttribute('open', '');
        this.state.setState('sidebarOpen', true);
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.sidebar.removeAttribute('open');
        this.state.setState('sidebarOpen', false);
        document.body.style.overflow = '';
    }

    setupLists() {
        // Categories list
        const categoryList = document.getElementById('category-list');
        CATEGORIES.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = category;
            btn.addEventListener('click', () => this.selectCategory(category));
            categoryList.appendChild(btn);
        });

        // Countries list
        const countryList = document.getElementById('country-list');
        COUNTRIES.forEach(country => {
            const btn = document.createElement('button');
            btn.className = 'country-btn';
            btn.textContent = country;
            btn.addEventListener('click', () => this.selectCountry(country));
            countryList.appendChild(btn);
        });
    }

    selectCategory(category) {
        this.state.setState('selectedCategory', category);
        this.state.setState('currentQuery', category);
        this.state.setState('currentPage', 1);
        
        // Update subcategories
        this.updateSubcategories(category);
        
        // Reload grid
        this.ui.clearGrid();
        this.ui.loadMedia();
        this.closeSidebar();
    }

    selectCountry(country) {
        this.state.setState('selectedCountry', country);
        this.state.setState('currentQuery', `${this.state.state.selectedCategory || 'travel'} ${country}`);
        this.state.setState('currentPage', 1);
        
        this.ui.clearGrid();
        this.ui.loadMedia();
        this.closeSidebar();
    }

    updateSubcategories(category) {
        const container = document.getElementById('subcategory-container');
        const subcategories = SUBCATEGORIES[category] || [];
        
        if (subcategories.length === 0) {
            container.innerHTML = '<p class="subcategory-hint">No subcategories available</p>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'subcategory-list';
        
        subcategories.forEach(sub => {
            const chip = document.createElement('button');
            chip.className = 'subcategory-chip';
            chip.textContent = sub;
            chip.addEventListener('click', () => {
                this.state.setState('currentQuery', `${category} ${sub}`);
                this.state.setState('currentPage', 1);
                this.ui.clearGrid();
                this.ui.loadMedia();
                this.closeSidebar();
            });
            list.appendChild(chip);
        });

        container.innerHTML = '';
        container.appendChild(list);
    }

    showFavoritesGrid() {
        const favorites = this.state.state.favorites;
        if (favorites.length === 0) {
            alert('No favorites saved yet!');
            return;
        }

        // Transform favorites into media format
        const mediaItems = favorites.map(fav => ({
            id: fav.id,
            type: fav.type,
            src: { 
                original: fav.url,
                medium: fav.thumb 
            },
            photographer: fav.photographer,
            width: fav.width,
            height: fav.height,
            alt: fav.alt,
        }));

        this.state.setState('currentQuery', 'favorites');
        this.ui.clearGrid();
        this.ui.renderMedia(mediaItems);
    }
}

// Initialize Application
class App {
    constructor() {
        this.state = new StateManager();
        this.api = new APIService();
        this.ui = new UIManager(this.state, this.api);
        this.modal = new ModalManager(this.state);
        this.sidebar = new SidebarManager(this.state, this.ui);
        this.infiniteScroll = new InfiniteScrollManager(this.state, this.ui);
        
        this.initializeApp();
    }

    async initializeApp() {
        // Randomize initial content
        this.randomizeInitialQuery();
        
        // Load initial media
        await this.ui.loadMedia();
        
        // Setup lazy loading for images
        this.setupLazyLoading();
        
        // Update UI elements
        this.ui.updateFavoritesCount();
        
        // Set initial dark mode
        document.getElementById('dark-mode-toggle').checked = this.state.state.darkMode;
        
        console.log('🚀 Stocks by PirateRuler.com initialized successfully');
    }

    randomizeInitialQuery() {
        // Pick random category
        const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        
        // Pick random subcategory if available
        const subcategories = SUBCATEGORIES[randomCategory] || [];
        const randomSub = subcategories.length > 0 ? 
            subcategories[Math.floor(Math.random() * subcategories.length)] : 
            '';
        
        // Pick random page
        const randomPage = Math.floor(Math.random() * CONFIG.MAX_PAGES) + 1;
        
        // Set state
        this.state.setState('currentQuery', randomSub ? `${randomCategory} ${randomSub}` : randomCategory);
        this.state.setState('currentPage', randomPage);
        
        // Update search input
        document.querySelector('.search-input').value = this.state.state.currentQuery;
        
        console.log('Randomized query:', this.state.state.currentQuery, 'Page:', randomPage);
    }

    setupLazyLoading() {
        const imageObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src || img.src;
                        imageObserver.unobserve(img);
                    }
                });
            },
            { rootMargin: '100px' }
        );

        // Observe images as they're added
        this.state.on('statechange', (data) => {
            if (data.key === 'favorites') {
                this.ui.updateFavoritesCount();
            }
        });

        // Intercept new cards and observe their images
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.classList && node.classList.contains('media-card')) {
                        const img = node.querySelector('.media-thumb');
                        if (img) imageObserver.observe(img);
                    }
                });
            });
        });

        observer.observe(this.ui.grid, { childList: true });
    }
}

// Data Constants
const CATEGORIES = [
    'Abstract', 'Animals', 'Architecture', 'Art', 'Backgrounds', 'Beauty', 'Birds', 
    'Black & White', 'Business', 'Cars', 'Celebrities', 'Cities', 'Coding', 'Clouds', 
    'Clothing', 'Coffee', 'Cosplay', 'Couples', 'Crypto', 'Cute', 'Dance', 'Desert', 
    'Dogs', 'Drinks', 'Earth', 'Education', 'Fantasy', 'Fashion', 'Fire', 'Fitness', 
    'Flowers', 'Food', 'Forests', 'Galaxy', 'Gaming', 'Gardens', 'Happiness', 'HDR', 
    'Horror', 'Hotels', 'Interior', 'Japan', 'Korea', 'Landmarks', 'Landscapes', 'Love', 
    'Macro', 'Minimal', 'Money', 'Monuments', 'Moon', 'Mountains', 'Music', 'Neon', 
    'Night', 'Ocean', 'Patterns', 'People', 'Portraits', 'Rain', 'Retro', 'River', 
    'Roads', 'Romance', 'Sand', 'Shadows', 'Shopping', 'Sky', 'Snow', 'Sports', 
    'Storms', 'Summer', 'Sunlight', 'Technology', 'Temple', 'Textures', 'Tigers', 
    'Toys', 'Travel', 'Trees', 'Urban', 'Vehicles', 'Vintage', 'Water', 'Weddings', 
    'Wildlife', 'Winter', 'Workspaces', 'Yoga', 'Festival', 'Culture', 'Wildlife Closeup', 
    'Forest Trails', 'Cinematic Shots', 'Drone Views', 'Long Exposure', 'Animals Macro', 
    'Retro Film', 'Urban Night', 'Street Photography', 'Misty Mountains', 'Northern Lights', 
    'Galaxy Shot', 'Beaches', 'Deserts', 'Cafes', 'Restaurants', 'Architecture Interior', 
    'City Skylines', 'Tropical Islands', 'Abstract Art', 'Digital Art', 'Nature Patterns', 
    'Minimal Design', 'Food Photography', 'Fashion Photography', 'Sports Action', 
    'Technology Innovation', 'Space Exploration', 'Underwater World', 'Aerial Photography'
];

const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 
    'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 
    'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 
    'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 
    'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 
    'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 
    'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 
    'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 
    'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 
    'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 
    'Korea, North', 'Korea, South', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 
    'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 
    'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 
    'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 
    'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 
    'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 
    'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 
    'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 
    'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 
    'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 
    'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 
    'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 
    'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 
    'Zambia', 'Zimbabwe'
];

const SUBCATEGORIES = {
    'Animals': ['Dogs', 'Cats', 'Lions', 'Tigers', 'Birds', 'Horses', 'Wolves', 'Elephants'],
    'Travel': ['Cities', 'Mountains', 'Airports', 'Hotels', 'Temples', 'Oceans', 'Tropical', 'Urban Exploration'],
    'Food': ['Desserts', 'Drinks', 'Fruits', 'Cooking', 'Fast Food', 'Luxury Dining', 'Baking', 'Vegan'],
    'Nature': ['Forests', 'Rivers', 'Lakes', 'Cliffs', 'Caves', 'Meadows', 'Waterfalls', 'Valleys'],
    'Fashion': ['Models', 'Runways', 'Street Style', 'Luxury Outfits', 'Accessories', 'Jewelry'],
    'Cars': ['Sports Cars', 'Vintage Cars', 'Electric Cars', 'Motorcycles', 'Racing', 'Concept Cars'],
    'Architecture': ['Interior', 'Skyscrapers', 'Houses', 'Bridges', 'Museums', 'Churches'],
    'Technology': ['Smartphones', 'Computers', 'AI', 'Robotics', 'Space Tech', 'Gadgets'],
    'Sports': ['Football', 'Basketball', 'Tennis', 'Swimming', 'Gym', 'Yoga', 'Running'],
    'Art': ['Digital Art', 'Paintings', 'Sculptures', 'Street Art', 'Abstract', 'Modern Art'],
    'Music': ['Concerts', 'Instruments', 'DJs', 'Classical', 'Rock', 'Jazz'],
    'People': ['Portraits', 'Business', 'Families', 'Children', 'Elderly', 'Groups'],
    'Landscape': ['Mountains', 'Deserts', 'Beaches', 'Forests', 'Islands', 'Canyons'],
    'City': ['Skyscrapers', 'Street View', 'Night Life', 'Markets', 'Traffic', 'Parks'],
    'Weather': ['Sunny', 'Rainy', 'Snowy', 'Stormy', 'Foggy', 'Rainbow'],
};

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Service Worker Registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            console.log('Service Worker registration skipped');
        });
    });
}
