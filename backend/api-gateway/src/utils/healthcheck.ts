import axios from "axios";

export const checkServiceHealth = async (name: string, url: string) => {
  try {
    const res = await axios.get(`${url}/health`);
    return { [name]: { status: "UP", code: res.status } };
  } catch (err: any) {
    let errorMsg = "";

    if (err.response) {
      errorMsg = `HTTP ${err.response.status} - ${err.response.statusText}`;
    } else if (err.request) {
      errorMsg = `No response from server: ${err.code || err.message}`;
    } else {
      errorMsg = err.message;
    }

    return {
      [name]: {
        status: "DOWN",
        error: errorMsg,
        code: err.response?.status || null,
      },
    };
  }
};
