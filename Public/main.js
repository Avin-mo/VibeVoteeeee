// pop up for guest room
document.querySelectorAll(".end").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelector(".popup1").style.display = "flex";
    });
});

document.querySelector(".no").addEventListener("click", function () {
    document.querySelector(".popup1").style.display = "none";
});


// pop up for host room
document.querySelectorAll(".end").forEach(button => {
    button.addEventListener("click", function () {
        document.querySelector(".popup1").style.display = "flex";
    });
});

document.querySelector(".no").addEventListener("click", function () {
    document.querySelector(".popup1").style.display = "none";
});



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
