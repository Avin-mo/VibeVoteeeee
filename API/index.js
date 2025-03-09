import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3050;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const FILE_PATH = "./rooms.json"; //json path

//load rooms from json file 
const loadRooms = () => {
    if (fs.existsSync(FILE_PATH)) {
        return JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));
    }
    return {};
};

//save Rooms to JSON File
const saveRooms = (rooms) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(rooms, null, 2));
};

let rooms = loadRooms(); // store queues per room

// OpenAI for AI auto-play
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// AI auto-song generator
const getAISong = async (roomId) => {
    try {
        const lastPlayed = rooms[roomId]?.history || [];

        if (lastPlayed.length === 0) {
            return "No past songs available"; // if no history, AI does nothing
        }

        const playedTitles = lastPlayed.map(song => song.title);

        let suggestedSong;
        let attempts = 0; // prevent infinite loops

        do {
            const response = await openai.createCompletion({
                model: "text-davinci-003",
                prompt: `Based on these songs: ${playedTitles.join(", ")}, suggest a new song that fits the same style and mood. Do not include any of these songs in your answer.`,
                max_tokens: 50,
            });

            suggestedSong = response.data.choices[0].text.trim();
            attempts++;
        } while (playedTitles.includes(suggestedSong) && attempts < 3); // mx 3 attempts

        return suggestedSong;
    } catch (error) {
        console.error("AI Song Error:", error);
        return "Random AI Song";
    }
};

// WebSocket connection - create a room
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("create-room", (data, callback) => {
        const roomId = Math.random().toString(36).substring(2, 8);

        rooms[roomId] = {
            host: socket.id,
            queue: [],
            users: [socket.id],
            nowPlaying: null,
            history: []
        };

        saveRooms(rooms);
        socket.join(roomId);
        callback(roomId);
    });

    // join a room & get the full song list 
    socket.on("join-room", (roomId) => {
        if (!rooms[roomId]) {
            socket.emit("error", "Room does not exist. Please enter a valid room number.");
            return;
        }

        //add user to room 
        rooms[roomId].users.push(socket.id);
        saveRooms(rooms);

        //join the correct room 
        socket.join(roomId);

        // send the current queue & now-playing song to the new user
        socket.emit("update-queue", rooms[roomId].queue);
        socket.emit("update-playing", rooms[roomId].nowPlaying);
        socket.emit("update-host", rooms[roomId].host);

        io.to(roomId).emit("update-users", rooms[roomId].users);
    });  

    // add a song & notify everyone
    socket.on("add-song", ({ roomId, song }) => {
        // console.log(rooms, roomId, song);
        if (!rooms[roomId]) return;

        //If the queue already has 20 songs, remove the one with the least votes
        if (rooms[roomId].queue.length >= 20) {
            rooms[roomId].queue.sort((a, b) => a.votes - b.votes);
            rooms[roomId].queue.shift();
        }

        song.id = extractVideoId(song.link);
        rooms[roomId].queue.push({ ...song, votes: 0 });
        console.log("queue");
        console.log(rooms[roomId].queue);
        saveRooms(rooms);

        io.to(roomId).emit("update-queue", rooms[roomId].queue);
    });

    // vote for a song & update the list 
    socket.on("vote-song", ({ roomId, songId }) => {
        if (!rooms[roomId]) return;

        const song = rooms[roomId].queue.find((s) => s.id === songId);
        if (song) song.votes += 1;

        rooms[roomId].queue.sort((a, b) => b.votes - a.votes);
        saveRooms(rooms);

        io.to(roomId).emit("update-queue", rooms[roomId].queue);
    });

    // play next song & remove from queue
    socket.on("play-next", async (roomId) => {
        if (!rooms[roomId]) return;

        if (!rooms[roomId].history) {
            rooms[roomId].history = []; // Ensure history exists
        }

        if (rooms[roomId].queue.length === 0) {
            // AI generates a new song based on history if the queue is empty
            const aiSongTitle = await getAISong(roomId);

            if (aiSongTitle !== "No past songs available") {
                rooms[roomId].queue.push({
                    id: Date.now(),
                    title: aiSongTitle,
                    platform: "AI-Generated",
                    votes: 0
                });
            }
        }

        const nextSong = rooms[roomId].queue.shift();

        if (nextSong) {
            rooms[roomId].nowPlaying = nextSong;
            rooms[roomId].history.push(nextSong);
            saveRooms(rooms);

            io.to(rooms[roomId].host).emit("play-song", nextSong);
            io.to(roomId).emit("update-queue", rooms[roomId].queue);
        }
    });

    // transfer host when current host leaves 
    socket.on("disconnect", () => {
        const roomId = Object.keys(rooms).find(id => rooms[id].users.includes(socket.id));
        if (!roomId) return;

        // Remove user from room
        rooms[roomId].users = rooms[roomId].users.filter(user => user !== socket.id);

        // If host leaves, assign a new host (if available)
        if (rooms[roomId].host === socket.id) {
            rooms[roomId].host = rooms[roomId].users.length > 0 ? rooms[roomId].users[0] : null;
            io.to(roomId).emit("update-host", rooms[roomId].host);
        }

        // If no users left, delete the room
        if (rooms[roomId].users.length === 0) {
            delete rooms[roomId];
        }

        saveRooms(rooms);  // always save rooms after modification
    });

    // extract video ID from YouTube/Spotify links
    const extractVideoId = (link) => {
        if (link.includes("youtube.com") || link.includes("youtu.be")) {
            return link.split("v=")[1]?.split("&")[0] || link.split("/").pop();
        }
        if (link.includes("spotify.com/track/")) {
            return link.split("/track/")[1]?.split("?")[0];
        }
        return "";
    };

    // get embeddable song link
    const getSongEmbedUrl = (link) => {
        if (link.includes("youtube.com") || link.includes("youtu.be")) {
            return `https://www.youtube.com/embed/${extractVideoId(link)}`;
        }
        if (link.includes("spotify.com/track/")) {
            return `https://open.spotify.com/embed/track/${extractVideoId(link)}`;
        }
        return link; // Default for AI-generated songs
    };
});

// start server 
server.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
