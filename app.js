import { fetchImages, fetchVideos } from './api.js';

const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const filterChips = document.querySelectorAll('.chip');
const cardGrid = document.getElementById('card-grid');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const modalImage = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const modalAttribution = document.getElementById('modal-attribution');
const downloadButton = document.getElementById('download-button');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const clearCacheButton = document.getElementById('clear-cache');

// Toggle sidebar
hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

// Search functionality
searchButton.addEventListener('click', () => {
  const query = searchInput.value;
  if (query) {
    fetchImages(query, 1).then(data => {
      renderCards(data.photos);
    });
  }
});

// Filter chips
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const category = chip.textContent.toLowerCase();
    if (category === 'all') {
      fetchImages('', 1).then(data => {
        renderCards(data.photos);
      });
    } else if (category === 'photos') {
      fetchImages('', 1).then(data => {
        renderCards(data.photos);
      });
    } else if (category === 'videos') {
      fetchVideos('', 1).then(data => {
        renderCards(data.videos);
      });
    } else {
      fetchImages(category, 1).then(data => {
        renderCards(data.photos);
      });
    }
  });
});

// Render cards
function renderCards(cards) {
  cardGrid.innerHTML = '';
  cards.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.innerHTML = `
      <img src="${card.src.medium}" alt="${card.photographer}">
      <div class="overlay">
        <i class="fas fa-download"></i>
        <i class="fas fa-heart"></i>
      </div>
    `;
    cardElement.addEventListener('click', () => {
      modalImage.src = card.src.large;
      modalCaption.textContent = card.photographer;
      modalAttribution.textContent = `Source: ${card.src.original}`;
      modal.style.display = 'block';
    });
    cardGrid.appendChild(cardElement);
  });
}

// Modal close
document.querySelector('.close').addEventListener('click', () => {
  modal.style.display = 'none';
});

// Download button
downloadButton.addEventListener('click', () => {
  window.open(modalAttribution.textContent, '_blank');
});

// Dark mode toggle
darkModeToggle.addEventListener('change', () => {
  if (darkModeToggle.checked) {
    document.body.style.backgroundColor = '#0f1720';
    document.body.style.color = '#E6EEF2';
  } else {
    document.body.style.backgroundColor = '#fff';
    document.body.style.color = '#000';
  }
});

// Clear cache
clearCacheButton.addEventListener('click', () => {
  localStorage.clear();
});

// Infinite scroll and lazy loading
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    const query = searchInput.value;
    const page = parseInt(localStorage.getItem('page')) || 1;
    localStorage.setItem('page', page + 1);
    fetchImages(query, page + 1).then(data => {
      renderCards(data.photos);
    });
  }
});

// API functions
async function fetchImages(query, page) {
  const response = await fetch(`https://api.pexels.com/v1/search?q=${encodeURIComponent(query)}&per_page=30&page=${page}`, {
    headers: {
      Authorization: 'sCGpOigHSBn3xjOTedMS977vcjXS3bguZuxGIvj6f39tT6LF1xNFkxh3'
    }
  });
  return response.json();
}

async function fetchVideos(query, page) {
  const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}`, {
    headers: {
      Authorization: 'sCGpOigHSBn3xjOTedMS977vcjXS3bguZuxGIvj6f39tT6LF1xNFkxh3'
    }
  });
  return response.json();
}
