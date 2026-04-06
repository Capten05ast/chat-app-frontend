


import { io } from "socket.io-client";

// autoConnect: false — socket will NOT connect until we explicitly call socket.connect()
// This prevents the socket from connecting before the user is authenticated,
// which caused the "join" event to be emitted before the connection was ready,
// breaking all real-time features after logout/login
export const socket = io("https://chat-app-backend-gieg.onrender.com", {
  withCredentials: true,
  autoConnect: false,
});
