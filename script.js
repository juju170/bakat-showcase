// --- Firebase Config (ganti sesuai punyamu) ---
const firebaseConfig = {
    apiKey: "AIzaSyCCnLJhpO7PmjCi38v7gZe0j3Cu36Ft-sI",
  authDomain: "chat-bakat.firebaseapp.com",
  projectId: "chat-bakat",
  storageBucket: "chat-bakat.firebasestorage.app",
  messagingSenderId: "159277911265",
  appId: "1:159277911265:web:1e3d032d4f5b8033637ba0"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Chat ---
const messagesDiv = document.getElementById("messages");
const input = document.getElementById("messageInput");
const username = document.getElementById("username");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = () => {
  const name = username.value.trim() || "Anonim";
  const text = input.value.trim();
  if (text === "") return;

  db.ref("chat").push({
    name,
    text,
    time: Date.now()
  });

  input.value = "";
};

// Tampilkan pesan realtime
db.ref("chat").on("child_added", snapshot => {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.textContent = `${msg.name}: ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// --- Media dari GitHub ---
fetch("https://raw.githubusercontent.com/USERNAME/REPO/main/data.json")
  .then(res => res.json())
  .then(data => {
    const audio = document.getElementById("audioPlayer");
    const judul = document.getElementById("judulMedia");

    if (data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)];
      audio.src = random.file;
      judul.textContent = `${random.judul} — ${random.nama}`;
    } else {
      judul.textContent = "Belum ada media.";
    }
  })
  .catch(err => console.error("Gagal ambil media:", err));