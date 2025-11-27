export async function fetchImages(query, page) {
  const response = await fetch(`https://api.pexels.com/v1/search?q=${encodeURIComponent(query)}&per_page=30&page=${page}`, {
    headers: {
      Authorization: 'sCGpOigHSBn3xjOTedMS977vcjXS3bguZuxGIvj6f39tT6LF1xNFkxh3'
    }
  });
  return response.json();
}

export async function fetchVideos(query, page) {
  const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}`, {
    headers: {
      Authorization: 'sCGpOigHSBn3xjOTedMS977vcjXS3bguZuxGIvj6f39tT6LF1xNFkxh3'
    }
  });
  return response.json();
}
