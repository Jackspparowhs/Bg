// ============================================
// STOCKS BY PIRATERULER.COM - FULL LOGIC
// ============================================

// API CONFIGURATION
const API_KEY = "sCGpOigHSBn3xjOTedMS977vcjXS3bguZuxGIvj6f39tT6LF1xNFkxh3"
const PEXELS_PHOTOS_API = "https://api.pexels.com/v1/search"
const PEXELS_VIDEOS_API = "https://api.pexels.com/videos/search"

// APP STATE
const appState = {
  currentPage: 1,
  currentQuery: "random",
  currentType: "all",
  isLoading: false,
  galleryItems: [],
  favorites: [],
  darkMode: false,
  seed: Math.random(),
}

// ============================================
// CATEGORIES, COUNTRIES, SUBCATEGORIES DATA
// ============================================

const CATEGORIES = [
  "Abstract",
  "Animals",
  "Architecture",
  "Art",
  "Backgrounds",
  "Beauty",
  "Birds",
  "Black & White",
  "Business",
  "Cars",
  "Celebrities",
  "Cities",
  "Coding",
  "Clouds",
  "Clothing",
  "Coffee",
  "Cosplay",
  "Couples",
  "Crypto",
  "Cute",
  "Dance",
  "Desert",
  "Dogs",
  "Drinks",
  "Earth",
  "Education",
  "Fantasy",
  "Fashion",
  "Fire",
  "Fitness",
  "Flowers",
  "Food",
  "Forests",
  "Galaxy",
  "Gaming",
  "Gardens",
  "Happiness",
  "HDR",
  "Horror",
  "Hotels",
  "Interior",
  "Japan",
  "Korea",
  "Landmarks",
  "Landscapes",
  "Love",
  "Macro",
  "Minimal",
  "Money",
  "Monuments",
  "Moon",
  "Mountains",
  "Music",
  "Neon",
  "Night",
  "Ocean",
  "Patterns",
  "People",
  "Portraits",
  "Rain",
  "Retro",
  "River",
  "Roads",
  "Romance",
  "Sand",
  "Shadows",
  "Shopping",
  "Sky",
  "Snow",
  "Sports",
  "Storms",
  "Summer",
  "Sunlight",
  "Technology",
  "Temple",
  "Textures",
  "Tigers",
  "Toys",
  "Travel",
  "Trees",
  "Urban",
  "Vehicles",
  "Vintage",
  "Water",
  "Weddings",
  "Wildlife",
  "Winter",
  "Workspaces",
  "Yoga",
  "Festival",
  "Culture",
  "Wildlife Closeup",
  "Forest Trails",
  "Cinematic Shots",
  "Drone Views",
  "Long Exposure",
  "Animals Macro",
  "Retro Film",
  "Urban Night",
  "Street Photography",
  "Misty Mountains",
  "Northern Lights",
  "Galaxy Shot",
  "Beaches",
  "Deserts",
  "Cafes",
  "Restaurants",
  "Architecture Interior",
  "City Skylines",
  "Tropical Islands",
]

const COUNTRIES = [
  "India",
  "Japan",
  "South Korea",
  "China",
  "USA",
  "UK",
  "Canada",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Thailand",
  "UAE",
  "Saudi Arabia",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "Peru",
  "Colombia",
  "Russia",
  "Ukraine",
  "Turkey",
  "Egypt",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Australia",
  "New Zealand",
  "Indonesia",
  "Malaysia",
  "Singapore",
  "Philippines",
  "Vietnam",
  "Pakistan",
  "Bangladesh",
  "Turkey",
  "Greece",
  "Portugal",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Croatia",
  "Serbia",
  "Ireland",
  "Iceland",
  "Luxembourg",
  "Cyprus",
  "Malta",
  "Slovenia",
  "Slovakia",
  "Bulgaria",
  "Lithuania",
  "Latvia",
  "Estonia",
  "Morocco",
  "Tunisia",
  "Algeria",
  "Libya",
  "Sudan",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Zimbabwe",
  "Zambia",
  "Botswana",
  "Namibia",
  "Angola",
  "Mozambique",
  "Malawi",
  "Madagascar",
  "Mauritius",
  "Seychelles",
  "Jamaica",
  "Trinidad & Tobago",
  "Bahamas",
  "Barbados",
  "Dominica",
  "Puerto Rico",
]

const SUBCATEGORIES = {
  Animals: ["Dogs", "Cats", "Lions", "Tigers", "Birds", "Horses", "Wolves", "Deer"],
  Travel: ["Cities", "Mountains", "Airports", "Hotels", "Temples", "Oceans", "Tropical", "Urban Exploration"],
  Food: ["Desserts", "Drinks", "Fruits", "Cooking", "Fast Food", "Luxury Dining", "Bakery"],
  Nature: ["Forests", "Rivers", "Lakes", "Cliffs", "Caves", "Meadows", "Valleys"],
  Fashion: ["Models", "Runways", "Street Style", "Luxury Outfits", "Casual Wear"],
  Cars: ["Sports Cars", "Vintage Cars", "Electric Cars", "Motorcycles", "Trucks"],
  Architecture: ["Modern", "Classic", "Industrial", "Religious", "Residential", "Commercial"],
  Photography: ["Landscape", "Portrait", "Street", "Macro", "Wildlife", "Aerial"],
}

// ============================================
// DOM ELEMENTS
// ============================================

const menuBtn = document.getElementById("menuBtn")
const sidebar = document.getElementById("sidebar")
const sidebarClose = document.getElementById("sidebarClose")
const sidebarOverlay = document.getElementById("sidebarOverlay")
const searchInput = document.getElementById("searchInput")
const searchBtn = document.getElementById("searchBtn")
const gallery = document.getElementById("gallery")
const modal = document.getElementById("modal")
const modalOverlay = document.getElementById("modalOverlay")
const modalClose = document.getElementById("modalClose")
const darkModeToggle = document.getElementById("darkModeToggle")
const clearCacheBtn = document.getElementById("clearCacheBtn")
const categoryList = document.getElementById("categoryList")
const countryList = document.getElementById("countryList")
const subcategoryList = document.getElementById("subcategoryList")
const favoritesCount = document.getElementById("favoritesCount")

// ============================================
// INITIALIZATION
// ============================================

function init() {
  setupEventListeners()
  loadFavorites()
  populateSidebarLists()
  loadInitialGallery()
  setupDarkMode()
}

function setupEventListeners() {
  menuBtn.addEventListener("click", openSidebar)
  sidebarClose.addEventListener("click", closeSidebar)
  sidebarOverlay.addEventListener("click", closeSidebar)

  searchBtn.addEventListener("click", performSearch)
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch()
  })

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", handleFilterChange)
  })

  modalClose.addEventListener("click", closeModal)
  modalOverlay.addEventListener("click", closeModal)

  darkModeToggle.addEventListener("click", toggleDarkMode)
  clearCacheBtn.addEventListener("click", clearCache)

  // Infinite scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !appState.isLoading) {
        loadMoreGallery()
      }
    })
  })

  const sentinel = document.createElement("div")
  sentinel.id = "scroll-sentinel"
  gallery.appendChild(sentinel)
  observer.observe(sentinel)
}

// ============================================
// SIDEBAR MANAGEMENT
// ============================================

function openSidebar() {
  sidebar.classList.add("active")
  sidebarOverlay.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeSidebar() {
  sidebar.classList.remove("active")
  sidebarOverlay.classList.remove("active")
  document.body.style.overflow = ""
}

function populateSidebarLists() {
  // Categories
  categoryList.innerHTML = CATEGORIES.map(
    (cat) => `<button class="category-item" data-query="${cat}">${cat}</button>`,
  ).join("")

  // Countries
  countryList.innerHTML = COUNTRIES.map(
    (country) => `<button class="country-item" data-query="${country}">${country}</button>`,
  ).join("")

  // Subcategories
  let subcategoryHtml = ""
  for (const [main, subs] of Object.entries(SUBCATEGORIES)) {
    subcategoryHtml += `
            <div class="subcategory-group">
                <strong style="font-size: 11px; color: var(--color-accent-teal); margin-bottom: 6px; display: block;">${main}</strong>
                ${subs
                  .map(
                    (sub) =>
                      `<button class="subcategory-item" data-query="${sub}" style="margin-bottom: 4px;">${sub}</button>`,
                  )
                  .join("")}
            </div>
        `
  }
  subcategoryList.innerHTML = subcategoryHtml

  // Add click handlers
  document.querySelectorAll("[data-query]").forEach((btn) => {
    btn.addEventListener("click", () => {
      searchInput.value = btn.dataset.query
      performSearch()
      closeSidebar()
    })
  })
}

// ============================================
// SEARCH & FILTER
// ============================================

function handleFilterChange(e) {
  document.querySelectorAll(".chip").forEach((chip) => chip.classList.remove("active"))
  e.target.classList.add("active")

  const filterType = e.target.dataset.type
  if (filterType === "all") {
    appState.currentType = "all"
  } else {
    appState.currentType = filterType
  }

  appState.currentPage = 1
  appState.galleryItems = []
  gallery.innerHTML =
    '<div class="loading-spinner" id="initialLoader"><div class="spinner"></div><p>Loading gallery...</p></div>'
  loadGallery()
}

function performSearch() {
  const query = searchInput.value.trim()
  if (!query) return

  appState.currentQuery = query
  appState.currentPage = 1
  appState.galleryItems = []
  gallery.innerHTML =
    '<div class="loading-spinner" id="initialLoader"><div class="spinner"></div><p>Loading gallery...</p></div>'
  loadGallery()
  closeSidebar()
}

// ============================================
// API CALLS
// ============================================

async function fetchPhotos(query, page) {
  try {
    const response = await fetch(`${PEXELS_PHOTOS_API}?query=${encodeURIComponent(query)}&per_page=40&page=${page}`, {
      headers: { Authorization: API_KEY },
    })
    if (!response.ok) throw new Error("API error")
    return await response.json()
  } catch (error) {
    console.error("Error fetching photos:", error)
    return { photos: [] }
  }
}

async function fetchVideos(query, page) {
  try {
    const response = await fetch(`${PEXELS_VIDEOS_API}?query=${encodeURIComponent(query)}&per_page=30&page=${page}`, {
      headers: { Authorization: API_KEY },
    })
    if (!response.ok) throw new Error("API error")
    return await response.json()
  } catch (error) {
    console.error("Error fetching videos:", error)
    return { videos: [] }
  }
}

// ============================================
// GALLERY LOADING
// ============================================

async function loadInitialGallery() {
  const randomCategories = CATEGORIES.slice().sort(() => Math.random() - 0.5)
  const randomQuery = randomCategories[0]
  appState.currentQuery = randomQuery
  appState.currentPage = 1

  searchInput.value = randomQuery
  loadGallery()
}

async function loadGallery() {
  appState.isLoading = true
  const loader = document.getElementById("initialLoader")

  if (appState.currentType === "all" || appState.currentType === "photos") {
    const photoData = await fetchPhotos(appState.currentQuery, appState.currentPage)
    if (photoData.photos && photoData.photos.length > 0) {
      appState.galleryItems = photoData.photos.map((photo) => ({
        id: photo.id,
        src: photo.src.medium,
        alt: photo.alt,
        photographer: photo.photographer,
        width: photo.width,
        height: photo.height,
        url: photo.url,
        type: "photo",
        downloadUrl: photo.src.original,
      }))
    }
  }

  if ((appState.currentType === "all" || appState.currentType === "videos") && appState.galleryItems.length < 30) {
    const videoData = await fetchVideos(appState.currentQuery, appState.currentPage)
    if (videoData.videos && videoData.videos.length > 0) {
      const videoItems = videoData.videos.map((video) => ({
        id: video.id,
        src: video.video_pictures[0].picture,
        alt: "Video thumbnail",
        photographer: video.user.name,
        width: video.width,
        height: video.height,
        url: video.url,
        type: "video",
        downloadUrl: video.video_files[0].link,
      }))
      appState.galleryItems = [...appState.galleryItems, ...videoItems]
    }
  }

  if (appState.galleryItems.length === 0) {
    gallery.innerHTML =
      '<div class="loading-spinner" style="grid-column: 1/-1;"><p>No results found. Try another search!</p></div>'
    appState.isLoading = false
    return
  }

  renderGallery()
  appState.currentPage++
  appState.isLoading = false
}

async function loadMoreGallery() {
  if (appState.isLoading) return

  const scrollLoader = document.getElementById("scrollLoader")
  scrollLoader.style.display = "flex"

  appState.isLoading = true

  const oldLength = appState.galleryItems.length

  if (appState.currentType === "all" || appState.currentType === "photos") {
    const photoData = await fetchPhotos(appState.currentQuery, appState.currentPage)
    if (photoData.photos && photoData.photos.length > 0) {
      const newPhotos = photoData.photos.map((photo) => ({
        id: photo.id,
        src: photo.src.medium,
        alt: photo.alt,
        photographer: photo.photographer,
        width: photo.width,
        height: photo.height,
        url: photo.url,
        type: "photo",
        downloadUrl: photo.src.original,
      }))
      appState.galleryItems = [...appState.galleryItems, ...newPhotos]
    }
  }

  if (
    (appState.currentType === "all" || appState.currentType === "videos") &&
    appState.galleryItems.length < oldLength + 60
  ) {
    const videoData = await fetchVideos(appState.currentQuery, appState.currentPage)
    if (videoData.videos && videoData.videos.length > 0) {
      const videoItems = videoData.videos.map((video) => ({
        id: video.id,
        src: video.video_pictures[0].picture,
        alt: "Video thumbnail",
        photographer: video.user.name,
        width: video.width,
        height: video.height,
        url: video.url,
        type: "video",
        downloadUrl: video.video_files[0].link,
      }))
      appState.galleryItems = [...appState.galleryItems, ...videoItems]
    }
  }

  renderGallery(oldLength)
  appState.currentPage++
  scrollLoader.style.display = "none"
  appState.isLoading = false
}

function renderGallery(startIndex = 0) {
  if (startIndex === 0) {
    gallery.innerHTML = ""
  }

  const fragment = document.createDocumentFragment()
  const isFavorited = (id) => appState.favorites.includes(id)

  appState.galleryItems.slice(startIndex).forEach((item) => {
    const card = document.createElement("div")
    card.className = "gallery-card"
    card.role = "button"
    card.tabIndex = 0
    card.setAttribute("aria-label", `${item.alt || "Gallery item"} by ${item.photographer}`)

    const img = document.createElement("img")
    img.className = "gallery-card-image lazy"
    img.src = item.src
    img.alt = item.alt || "Gallery item"
    img.loading = "lazy"
    img.onload = () => img.classList.add("loaded")

    const overlay = document.createElement("div")
    overlay.className = "gallery-card-overlay"

    const downloadBtn = document.createElement("button")
    downloadBtn.className = "card-icon-btn"
    downloadBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>'
    downloadBtn.title = "Download"
    downloadBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      downloadItem(item)
    })

    const favoriteBtn = document.createElement("button")
    favoriteBtn.className = `card-icon-btn ${isFavorited(item.id) ? "favorited" : ""}`
    favoriteBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'
    favoriteBtn.title = "Add to favorites"
    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      toggleFavorite(item.id, favoriteBtn)
    })

    overlay.appendChild(downloadBtn)
    overlay.appendChild(favoriteBtn)

    card.appendChild(img)
    card.appendChild(overlay)

    card.addEventListener("click", () => openModal(item))
    card.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        openModal(item)
      }
    })

    fragment.appendChild(card)
  })

  gallery.appendChild(fragment)
}

// ============================================
// MODAL
// ============================================

function openModal(item) {
  document.getElementById("modalImage").src = item.src
  document.getElementById("modalImage").alt = item.alt || "Preview image"
  document.getElementById("modalTitle").textContent = item.alt || "Untitled"
  document.getElementById("modalPhotographer").textContent = item.photographer || "Unknown"
  document.getElementById("modalResolution").textContent = `${item.width} × ${item.height}px`

  const favoriteBtn = document.getElementById("modalFavorite")
  const isFavorited = appState.favorites.includes(item.id)
  favoriteBtn.classList.toggle("favorited", isFavorited)
  favoriteBtn.innerHTML = isFavorited
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span>Remove from Favorites</span>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg><span>Add to Favorites</span>'

  document.getElementById("modalDownload").onclick = () => downloadItem(item)
  favoriteBtn.onclick = () => {
    toggleFavorite(item.id)
    openModal(item)
  }

  modal.classList.add("active")
  modal.setAttribute("aria-hidden", "false")
  document.body.style.overflow = "hidden"
}

function closeModal() {
  modal.classList.remove("active")
  modal.setAttribute("aria-hidden", "true")
  document.body.style.overflow = ""
}

// ============================================
// FAVORITES
// ============================================

function toggleFavorite(itemId, btnElement = null) {
  const index = appState.favorites.indexOf(itemId)
  if (index > -1) {
    appState.favorites.splice(index, 1)
  } else {
    appState.favorites.push(itemId)
  }

  if (btnElement) {
    btnElement.classList.toggle("favorited")
  }

  saveFavorites()
  updateFavoritesCount()
}

function saveFavorites() {
  localStorage.setItem("stocks-favorites", JSON.stringify(appState.favorites))
}

function loadFavorites() {
  try {
    const saved = localStorage.getItem("stocks-favorites")
    if (saved) appState.favorites = JSON.parse(saved)
  } catch (e) {
    console.error("Error loading favorites:", e)
  }
  updateFavoritesCount()
}

function updateFavoritesCount() {
  favoritesCount.textContent = appState.favorites.length
}

// ============================================
// DOWNLOAD
// ============================================

function downloadItem(item) {
  const link = document.createElement("a")
  link.href = item.downloadUrl
  link.target = "_blank"
  link.rel = "noopener"

  if (item.type === "video") {
    window.open(item.downloadUrl, "_blank")
  } else {
    link.download = `${item.alt || "image"}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// ============================================
// DARK MODE
// ============================================

function setupDarkMode() {
  const savedDarkMode = localStorage.getItem("dark-mode") === "true"
  if (savedDarkMode) {
    document.body.classList.add("dark-mode")
    appState.darkMode = true
  }
}

function toggleDarkMode() {
  appState.darkMode = !appState.darkMode
  document.body.classList.toggle("dark-mode")
  localStorage.setItem("dark-mode", appState.darkMode)
}

// ============================================
// CACHE
// ============================================

function clearCache() {
  if (confirm("Clear all cached data? This cannot be undone.")) {
    localStorage.clear()
    appState.favorites = []
    appState.galleryItems = []
    appState.currentPage = 1
    appState.currentQuery = "random"

    updateFavoritesCount()
    gallery.innerHTML =
      '<div class="loading-spinner" id="initialLoader"><div class="spinner"></div><p>Loading gallery...</p></div>'
    loadInitialGallery()
    alert("Cache cleared!")
  }
}

// ============================================
// START APP
// ============================================

document.addEventListener("DOMContentLoaded", init)
