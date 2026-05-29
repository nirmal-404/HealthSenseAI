import axios from "axios"

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:50000/api",
})

const isGenericAxiosMessage = (message?: string) =>
  Boolean(message && /^Request failed with status code \d{3}$/i.test(message))

const hasServiceMessage = (error: any) => {
  const serviceMessage = error?.response?.data?.message || error?.response?.data?.error
  return typeof serviceMessage === "string" && serviceMessage.trim().length > 0
}

const sanitizeAxiosError = (error: any) => {
  if (!error) {
    return
  }

  if (!hasServiceMessage(error) && isGenericAxiosMessage(error.message)) {
    error.message = ""
  }
}

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
    sanitizeAxiosError(error)

    // Handle global errors
    if (error.response?.status === 401) {
      console.log("Unauthorized")
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
