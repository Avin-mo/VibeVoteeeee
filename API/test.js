import { io } from "socket.io-client";

console.log("Test script started!");

const socket = io("http://localhost:3050");

socket.on("connect", () => {
    console.log("Connected to backend!");


    let roomId = "test123";
    console.log(`Joining Room: ${roomId}`);
    socket.emit("create-room", null, (response) => {
        console.log(response);
        roomId = response;
    });

    // Add a Song (WebSocket)
    setTimeout(() => {
        console.log("Adding Song...");
        socket.emit("add-song", {
            roomId: roomId,
            song: { id: Date.now(), title: "Test Song", platform: "Spotify", votes: 0, link: "https://www.youtube.com/watch?v=HQBG42Ggtac&t=1772s" }
        });
    }, 2000);

    // socket.emit("update-queue", (queue))
});


// Listen for Errors
socket.on("error", (err) => console.error(" Error:", err));
