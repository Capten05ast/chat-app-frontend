

import axios from "axios";

const instance = axios.create({
  baseURL: "https://chat-app-backend-gieg.onrender.com/api",
  withCredentials: true, // IMPORTANT for cookies
});

export default instance;

