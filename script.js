// --- PENGATURAN GLOBAL ---
const SESSION_ID = localStorage.getItem('session_id') || crypto.randomUUID();
localStorage.setItem('session_id', SESSION_ID);

let currentUserName = localStorage.getItem('locked_username');
let currentMediaTitle = "Belum Memilih";
let mediaData = [];

let currentChatRef = null;
let currentChatListener = null;

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyCCnLJhpO7PmjCi38v7gZe0j3Cu36Ft-sI",
  authDomain: "chat-bakat.firebaseapp.com",
  projectId: "chat-bakat",
  storageBucket: "chat-bakat.firebasestorage.app",
  messagingSenderId: "159277911265",
  appId: "1:159277911265:web:1e3d032d4f5b8033637ba0",
  databaseURL: "https://chat-bakat-default-rtdb.asia-southeast1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Elemen DOM ---
const messagesDiv = document.getElementById("messages");
const usersContainer = document.getElementById("usersContainer");
const input = document.getElementById("messageInput");
const usernameInput = document.getElementById("nameInput");
const sendBtn = document.getElementById("sendBtn");

// --- Inisialisasi Nama Pengguna ---
if (currentUserName) {
  usernameInput.value = currentUserName;
  lockUsername(currentUserName);
} else {
  usernameInput.value = "User-" + SESSION_ID.substring(0, 4);
  currentUserName = usernameInput.value;
}

// Status awal
trackUserStatus(currentMediaTitle, false);
db.ref('users/' + SESSION_ID).onDisconnect().remove();

// --- Heartbeat untuk update status aktif ---
setInterval(() => {
  db.ref('users/' + SESSION_ID).update({
    last_online: firebase.database.ServerValue.TIMESTAMP
  });
}, 30000); // update tiap 30 detik

// --- Fallback: hapus user kalau tab ditutup ---
window.addEventListener("beforeunload", () => {
  db.ref('users/' + SESSION_ID).remove();
});

// --- FUNGSI DASAR ---

function lockUsername(name) {
  usernameInput.value = name;
  usernameInput.disabled = true;
  usernameInput.style.opacity = 0.5;
  localStorage.setItem('locked_username', name);
}

function getChatRef(title) {
  const safeTitle = title.replace(/[.#$[\]/]/g, '_').replace(/\s/g, '-').toLowerCase();
  const key = (safeTitle.trim() === '' || safeTitle === 'belum-memilih')
    ? 'default-lobby'
    : safeTitle;
  return db.ref('chats/' + key);
}

function trackUserStatus(videoTitle, isFirstMessage) {
  const userRef = db.ref('users/' + SESSION_ID);
  if (isFirstMessage) {
    const chatRef = getChatRef(videoTitle);
    chatRef.push({
      name: "SYSTEM",
      text: `${currentUserName} baru saja bergabung!`,
      time: Date.now(),
      system: true
    });
  }

  userRef.set({
    name: currentUserName,
    video: videoTitle,
    last_online: firebase.database.ServerValue.TIMESTAMP,
    sessionId: SESSION_ID
  });
}

// --- CHAT DAN LISTENER ---
function setupChatListener() {
  if (currentChatRef && currentChatListener) {
    currentChatRef.off('child_added', currentChatListener);
  }

  messagesDiv.innerHTML = '';
  currentChatRef = getChatRef(currentMediaTitle);

  const listenerFunction = (snapshot) => {
    const msg = snapshot.val();
    const div = document.createElement("div");

    if (msg.system) {
      div.className = 'msg system-msg';
      div.textContent = msg.text;
    } else {
      const timeStr = new Date(msg.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      div.className = 'msg';
      div.innerHTML = `<strong>${msg.name}</strong> <span style="font-size: 0.7em; opacity: 0.6;">(${timeStr})</span>: ${msg.text}`;
    }

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  };

  currentChatListener = listenerFunction;
  currentChatRef.on("child_added", currentChatListener);

  const infoDiv = document.createElement("div");
  infoDiv.className = 'msg system-msg';
  infoDiv.textContent = `Anda berada di ruang chat: ${currentMediaTitle}`;
  messagesDiv.appendChild(infoDiv);
}

sendBtn.onclick = () => {
  let name = usernameInput.value.trim();
  const text = input.value.trim();

  if (text === "") return;

  if (currentMediaTitle === "Belum Memilih" || currentMediaTitle === "Error Memuat Media" || currentMediaTitle === "Tidak Ada Media") {
    const warningDiv = document.createElement("div");
    warningDiv.className = 'msg system-msg';
    warningDiv.textContent = "❗ Pilih video dulu sebelum kirim pesan.";
    messagesDiv.appendChild(warningDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return;
  }

  let isFirstMessage = false;
  if (!localStorage.getItem('locked_username')) {
    if (name === "" || name.includes("Anonim") || name.length < 3) {
      usernameInput.placeholder = "Nama minimal 3 karakter!";
      return;
    }
    currentUserName = name;
    lockUsername(currentUserName);
    isFirstMessage = true;
  } else {
    name = currentUserName;
  }

  getChatRef(currentMediaTitle).push({
    name: name,
    text: text,
    time: Date.now()
  });

  trackUserStatus(currentMediaTitle, isFirstMessage);
  input.value = "";
};

// --- PENGGUNA AKTIF REAL-TIME ---
db.ref("users").on("value", snapshot => {
  const users = snapshot.val();
  usersContainer.innerHTML = '';

  if (users) {
    const userList = Object.keys(users).map(key => users[key]);
    const activeUsers = userList.filter(user => (Date.now() - user.last_online) < (5 * 60 * 1000));

    if (activeUsers.length === 0) {
      usersContainer.innerHTML = '<p style="color: #999; text-align: center; font-size: 0.9em;">Saat ini hanya Anda yang aktif.</p>';
      return;
    }

    activeUsers.forEach(user => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'user-status-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'status-name';
      nameSpan.textContent = user.name + (user.sessionId === SESSION_ID ? ' (Anda)' : '');

      const videoSpan = document.createElement('span');
      videoSpan.className = 'status-video';
      videoSpan.textContent = `▶️ ${user.video}`;

      itemDiv.appendChild(nameSpan);
      itemDiv.appendChild(videoSpan);
      usersContainer.appendChild(itemDiv);
    });
  } else {
    usersContainer.innerHTML = '<p style="color: #999; text-align: center; font-size: 0.9em;">Saat ini belum ada pengguna lain yang aktif.</p>';
  }
});

// --- AMBIL DATA MEDIA DARI GITHUB ---
const MEDIA_URL = "https://raw.githubusercontent.com/juju170/bakat-showcase/main/data.json";

fetch(MEDIA_URL)
  .then(async res => {
    if (!res.ok) throw new Error(`Gagal memuat file dari URL. Status HTTP: ${res.status}`);
    return await res.json();
  })
  .then(data => {
    const playerDiv = document.getElementById("player");
    const mediaContainerDiv = document.getElementById("mediaContainer");

    mediaData = data.media || [];

    if (mediaData.length > 0) {
      const random = mediaData[Math.floor(Math.random() * mediaData.length)];
      playerDiv.innerHTML = '';
      loadAndTrackMedia(random, playerDiv);

      mediaContainerDiv.innerHTML = '';
      mediaData.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'media-item';
        itemDiv.textContent = `${item.judul} (${item.nama}) - ${item.tipe}`;
        itemDiv.onclick = () => loadAndTrackMedia(item, playerDiv);
        mediaContainerDiv.appendChild(itemDiv);
      });
    } else {
      playerDiv.innerHTML = "<p>Daftar media kosong.</p>";
      mediaContainerDiv.textContent = "Daftar kosong.";
      currentMediaTitle = "Tidak Ada Media";
      trackUserStatus(currentMediaTitle, false);
      setupChatListener();
    }
  })
  .catch(err => {
    document.getElementById("player").innerHTML = `<p style="color: red;">❌ Gagal ambil media (${err.message})</p>`;
    currentMediaTitle = "Error Memuat Media";
    trackUserStatus(currentMediaTitle, false);
    setupChatListener();
  });

// --- FUNGSI MEDIA (YouTube, Audio, Drive) ---
function loadAndTrackMedia(item, playerDiv) {
  playerDiv.innerHTML = '';
  let mediaHTML = '';

  if (item.tipe === 'video' && item.url.includes('youtube.com/embed')) {
    mediaHTML = `
      <div id="judulMedia">${item.judul} — ${item.nama}</div>
      <div style="position: relative; width: 100%; padding-bottom: 56.25%;">
        <iframe src="${item.url}" frameborder="0" allowfullscreen
          style="position:absolute; top:0; left:0; width:100%; height:100%;">
        </iframe>
      </div>`;
  } else if (item.tipe === 'audio' && item.url.includes('drive.google.com')) {
    mediaHTML = `
      <div id="judulMedia">${item.judul} — ${item.nama}</div>
      <iframe src="${item.url}" width="100%" height="100" allow="autoplay" style="border:none; border-radius:10px;"></iframe>`;
  } else {
    const tag = (item.tipe === 'audio') ? 'audio' : 'video';
    mediaHTML = `
      <div id="judulMedia">${item.judul} — ${item.nama}</div>
      <${tag} src="${item.url}" controls loop style="width:100%; border-radius:10px;"></${tag}>`;
  }

  playerDiv.innerHTML = mediaHTML;
  currentMediaTitle = item.judul;
  trackUserStatus(currentMediaTitle, false);
  setupChatListener();
}
