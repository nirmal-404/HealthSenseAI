import axiosInstance from "../axios";

export async function uploadImage(formData: FormData) {
    const res = await axiosInstance.post('/upload', formData)

    if (!res?.data?.success) {
        throw new Error("Image upload failed");
    }

    return res.data.url;
}