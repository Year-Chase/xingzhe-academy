import axios from 'axios'

const API_BASE = '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/#/login'
    }
    return Promise.reject(error)
  },
)

export function get<T = any>(url: string, params?: Record<string, any>) {
  return client.get<T>(url, { params }).then((r) => r.data)
}

export function post<T = any>(url: string, data?: any) {
  return client.post<T>(url, data).then((r) => r.data)
}

export function patch<T = any>(url: string, data?: any) {
  return client.patch<T>(url, data).then((r) => r.data)
}

export default client
