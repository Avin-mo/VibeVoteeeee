// pop up for party room
document.querySelectorAll(".end").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelector(".popup1").style.display = "flex";
    });
});

document.querySelector(".no").addEventListener("click", function () {
    document.querySelector(".popup1").style.display = "none";
});

document.querySelector(".yes").addEventListener("click", function () {
    window.location.href = "mainpage.html";
});

document.querySelectorAll(".add-songs-button").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelector(".add-song-popup").style.display = "flex";
    });
});

document.querySelector(".cancel").addEventListener("click", function () {
    document.querySelector(".add-song-popup").style.display = "none";
});


// music player
// constants for music player
const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById('audio');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const title = document.getElementById('title');
const cover = document.getElementById('cover');
const currTime = document.getElementById('#currTime');
const durTime = document.querySelector('#durTime');
const songs = ['El Mañana', 'When Will I See You Again'];

let songsIndex = 2;

loadSong(songs[songsIndex]);

// updates song details
function loadSong(song) {
    title.innerText = song;
    audio.src = `music/${song}.mp3`;
}

// plays the song
function playSong() {
    
}


// updating the queue 
// Sample queue (this will be replaced with backend data later)
let songQueue = [
    { id: 1, title: "luther", votes: 26 },
    { id: 2, title: "APT.", votes: 20 },
    { id: 3, title: "Who", votes: 20 },
    { id: 4, title: "Messy", votes: 16 },
    { id: 5, title: "ExtraL", votes: 16 },
    { id: 6, title: "Tattoo", votes: 13 },
    { id: 7, title: "Taste", votes: 11 }
];

// Object to store user votes (retrieved from localStorage)
let userVotes = JSON.parse(localStorage.getItem("userVotes")) || {};

// Function to render the queue
function renderQueue() {
    const queueContainer = document.querySelector(".track-list");
    queueContainer.innerHTML = ""; // Clear existing songs

    songQueue.forEach(song => {
        const songElement = document.createElement("div");
        songElement.classList.add("track");
        songElement.innerHTML = `
            ${song.title} <span class="votes">${song.votes}</span>
            <button class="upvote ${userVotes[song.id] ? 'voted' : ''}" 
                data-id="${song.id}">
                ⬆
            </button>
        `;
        queueContainer.appendChild(songElement);
    });

    addUpvoteListeners();
}

// Function to handle upvoting
function addUpvoteListeners() {
    document.querySelectorAll(".upvote").forEach(button => {
        button.addEventListener("click", (event) => {
            const songId = parseInt(event.target.dataset.id);
            toggleVote(songId, event.target);
        });
    });
}

// Function to toggle vote (upvote/remove vote)
function toggleVote(songId, button) {
    let song = songQueue.find(s => s.id === songId);
    
    if (song) {
        if (userVotes[songId]) {
            // If already voted, remove vote
            song.votes -= 1;
            delete userVotes[songId]; // Remove vote from memory
            button.classList.remove("voted"); // Reset button color
        } else {
            // If not voted, add vote
            song.votes += 1;
            userVotes[songId] = true; // Store vote in memory
            button.classList.add("voted"); // Change button color
        }

        // Save user votes in localStorage
        localStorage.setItem("userVotes", JSON.stringify(userVotes));

        // Sort queue based on votes (highest first)
        songQueue.sort((a, b) => b.votes - a.votes);

        // Re-render queue
        renderQueue();
    }
}

// Load the queue initially
document.addEventListener("DOMContentLoaded", renderQueue);
