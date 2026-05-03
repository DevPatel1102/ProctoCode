import { io } from "socket.io-client";
const socket = io("http://localhost:5000", { transports: ["websocket"] });
socket.on("connect", () => console.log("Connected!"));
socket.on("connect_error", (err) => console.log("Error:", err.message));
socket.on("behavior:created", (e) => console.log("Event:", e));
setTimeout(() => process.exit(0), 10000);
