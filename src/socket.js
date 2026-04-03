

import { io } from "socket.io-client";

export const socket = io("https://chat-app-backend-gieg.onrender.com", {
  withCredentials: true,
});



