import axios from 'axios'

// Automatically normalize API URL, defaulting to live Render backend
const getBaseURL = () => {
  let url = import.meta.env.VITE_API_URL
  if (!url || !url.trim()) {
    return 'https://booknest-0rbm.onrender.com/booknest/api'
  }
  url = url.trim().replace(/\/+$/, '')
  if (!url.includes('/api')) {
    url = url + '/booknest/api'
  }
  return url
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
})

export default api
