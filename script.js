// --- Firebase Config (ganti sesuai punyamu) ---
// Note: Menggunakan dummy config karena ini lingkungan simulasi
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
const username = document.getElementById("nameInput"); // Menggunakan nameInput dari HTML
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
  // Menggunakan kelas 'msg' dari style.css
  div.className = 'msg'; 
  div.textContent = `${msg.name}: ${msg.text}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// --- Media dari GitHub ---
// Catatan: Saya mengasumsikan URL ini mengarah ke file data.json Anda
fetch("https://raw.githubusercontent.com/USERNAME/REPO/main/data.json")
  .then(res => {
    // Cek jika ada masalah JSON parse akibat syntax error
    if (!res.ok) {
        throw new Error(`Gagal memuat JSON: ${res.statusText}`);
    }
    return res.json();
  })
  .then(data => {
    const playerDiv = document.getElementById("player");
    const mediaContainerDiv = document.getElementById("mediaContainer");
    
    // Perbaikan: Ambil array dari properti 'media'
    const mediaData = data.media || []; 

    if (mediaData.length > 0) {
      // Menampilkan media acak di Player
      const random = mediaData[Math.floor(Math.random() * mediaData.length)];
      
      playerDiv.innerHTML = ''; // Hapus pesan "Memuat media..."

      // Cek apakah URL adalah YouTube embed
      const isYouTube = random.url.includes('youtube.com/embed');

      let mediaHTML = '';
      
      if (isYouTube) {
        // Gunakan IFRAME untuk YouTube embed
        mediaHTML = `
            <div id="judulMedia">${random.judul} — ${random.nama}</div>
            <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 10px;">
                <iframe 
                    src="${random.url}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                ></iframe>
            </div>
        `;
      } else {
        // Gunakan <video> atau <audio> untuk file langsung
        const tag = (random.tipe === 'audio') ? 'audio' : 'video';
        mediaHTML = `
            <div id="judulMedia">${random.judul} — ${random.nama}</div>
            <${tag} src="${random.url}" controls loop></${tag}>
        `;
      }

      playerDiv.innerHTML = mediaHTML;

      // Menampilkan Daftar Media
      mediaContainerDiv.innerHTML = '';
      mediaData.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'media-item';
        itemDiv.textContent = `${item.judul} (${item.nama})`;
        // Tambahkan event click untuk memuat media jika diklik
        itemDiv.onclick = () => loadMedia(item, playerDiv);
        mediaContainerDiv.appendChild(itemDiv);
      });


    } else {
      playerDiv.innerHTML = "<p>Belum ada media.</p>";
      mediaContainerDiv.textContent = "Daftar kosong.";
    }
  })
  .catch(err => {
    document.getElementById("player").innerHTML = `<p style="color: red;">Gagal ambil media! Cek koneksi atau file JSON Anda. (${err.message})</p>`;
    console.error("Gagal ambil media:", err);
  });

// Fungsi untuk memuat media yang diklik dari daftar
function loadMedia(item, playerDiv) {
    playerDiv.innerHTML = '';
    const isYouTube = item.url.includes('youtube.com/embed');
    let mediaHTML = '';

    if (isYouTube) {
        mediaHTML = `
            <div id="judulMedia">${item.judul} — ${item.nama}</div>
            <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 10px;">
                <iframe 
                    src="${item.url}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                ></iframe>
            </div>
        `;
    } else {
        const tag = (item.tipe === 'audio') ? 'audio' : 'video';
        mediaHTML = `
            <div id="judulMedia">${item.judul} — ${item.nama}</div>
            <${tag} src="${item.url}" controls loop></${tag}>
        `;
    }

    playerDiv.innerHTML = mediaHTML;
}
