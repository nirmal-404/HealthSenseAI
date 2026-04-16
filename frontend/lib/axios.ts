import axios from "axios"

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:50000/api",
})

axiosInstance.interceptors.request.use(
  (config) => {
    // Example: attach token
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors
    if (error.response?.status === 401) {
      console.log("Unauthorized")
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
