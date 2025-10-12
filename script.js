// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCCnLJhpO7PmjCi38v7gZe0j3Cu36Ft-sI",
  authDomain: "chat-bakat.firebaseapp.com",
  projectId: "chat-bakat",
  storageBucket: "chat-bakat.firebasestorage.app",
  messagingSenderId: "159277911265",
  appId: "1:159277911265:web:1e3d032d4f5b8033637ba0"
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const playerDiv = document.getElementById("player");
const mediaListDiv = document.getElementById("media-list");
const messagesDiv = document.getElementById("messages");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Ambil data media dari GitHub
function loadMediaList() {
  fetch("https://raw.githubusercontent.com/juju170/bakat-showcase/main/data.json")
    .then(res => res.json())
    .then(data => {
      const mediaList = data.media || [];
      showMediaList(mediaList);
      if (mediaList.length > 0) playMedia(mediaList[0]);
    })
    .catch(err => {
      mediaListDiv.innerHTML = "<p style='color:gray'>Gagal memuat daftar media.</p>";
      console.error("Fetch error:", err);
    });
}

function showMediaList(mediaList) {
  mediaListDiv.innerHTML = "";
  mediaList.forEach(item => {
    const div = document.createElement("div");
    div.className = "media-item";
    div.textContent = `${item.judul} - oleh ${item.nama}`;
    div.onclick = () => playMedia(item);
    mediaListDiv.appendChild(div);
  });
}

function playMedia(item) {
  if (item.tipe === "video") {
    playerDiv.innerHTML = `
      <video controls autoplay>
        <source src="${item.url}" type="video/mp4">
      </video>
      <h3>${item.judul}</h3><p>oleh ${item.nama}</p>
    `;
  } else if (item.tipe === "audio") {
    playerDiv.innerHTML = `
      <audio controls autoplay>
        <source src="${item.url}" type="audio/mpeg">
      </audio>
      <h3>${item.judul}</h3><p>oleh ${item.nama}</p>
    `;
  } else if (item.tipe === "image") {
    playerDiv.innerHTML = `
      <img src="${item.url}" alt="${item.judul}">
      <h3>${item.judul}</h3><p>oleh ${item.nama}</p>
    `;
  }
}

// Chat Firebase
const messagesRef = db.ref("chat");

sendBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const text = messageInput.value.trim();
  if (name && text) {
    messagesRef.push({
      name: name,
      text: text,
      time: new Date().toLocaleString()
    });
    messageInput.value = "";
  }
});

messagesRef.on("child_added", (snapshot) => {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.className = "msg";
  div.textContent = `${msg.name}: ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Jalankan awal
loadMediaList();
