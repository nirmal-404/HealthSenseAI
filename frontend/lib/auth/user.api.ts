import axiosInstance from "../axios";

export const getUsers = async () => {
    const res = await axiosInstance.get("/users");
    return res.data;
};

export const getUserById = async (id: string) => {
    const res = await axiosInstance.get(`/users/${id}`);
    return res.data;
};