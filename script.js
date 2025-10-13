// --- PENGATURAN GLOBAL ---
// Dapatkan ID unik untuk sesi browser ini (penting untuk melacak user)
const SESSION_ID = localStorage.getItem('session_id') || crypto.randomUUID();
localStorage.setItem('session_id', SESSION_ID);

// Variabel untuk melacak status pengguna saat ini
let currentUserName = localStorage.getItem('locked_username');
let currentMediaTitle = "Belum Memilih";
let mediaData = []; // Untuk menyimpan data media setelah di-fetch

// --- Firebase Config (ganti sesuai punyamu) ---
// Note: Menggunakan dummy config karena ini lingkungan simulasi
const firebaseConfig = {
    apiKey: "AIzaSyCCnLJhpO7PmjCi38v7gZe0j3Cu36Ft-sI",
    authDomain: "chat-bakat.firebaseapp.com",
    projectId: "chat-bakat",
    storageBucket: "chat-bakat.firebasestorage.app",
    messagingSenderId: "159277911265",
    appId: "1:159277911265:web:1e3d032d4f5b8033637ba0",
    // BARU: Tambahkan databaseURL yang benar sesuai region Anda (asia-southeast1)
    databaseURL: "https://chat-bakat-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Elemen DOM ---
const messagesDiv = document.getElementById("messages");
const usersContainer = document.getElementById("usersContainer"); // BARU
const input = document.getElementById("messageInput");
const usernameInput = document.getElementById("nameInput");
const sendBtn = document.getElementById("sendBtn");

// --- Inisialisasi Awal ---

// Jika nama sudah ada di localStorage, kunci input nama
if (currentUserName) {
    usernameInput.value = currentUserName;
    lockUsername(currentUserName);
    // Notifikasi join tidak perlu dikirim lagi karena sudah pernah chat
} else {
    // Jika belum ada, gunakan ID sesi sebagai fallback nama awal
    usernameInput.value = "User-" + SESSION_ID.substring(0, 4);
    currentUserName = usernameInput.value;
}

// Catat status pengguna pertama kali saat halaman dimuat
trackUserStatus(currentMediaTitle, false); // Status awal
db.ref('users/' + SESSION_ID).onDisconnect().remove(); // Hapus status jika koneksi terputus

// --- FUNGSI PELACAKAN STATUS PENGGUNA BARU ---

/**
 * Mengunci input nama pengguna dan menyimpan nama di localStorage.
 * @param {string} name - Nama pengguna yang akan dikunci.
 */
function lockUsername(name) {
    usernameInput.value = name;
    usernameInput.disabled = true;
    usernameInput.style.opacity = 0.5;
    localStorage.setItem('locked_username', name);
}

/**
 * Memperbarui status online pengguna dan video yang sedang ditonton.
 * @param {string} videoTitle - Judul video yang sedang ditonton.
 * @param {boolean} isFirstMessage - Apakah ini pesan pertama yang dikirim.
 */
function trackUserStatus(videoTitle, isFirstMessage) {
    const userRef = db.ref('users/' + SESSION_ID);
    
    // Kirim notifikasi bergabung ke chat jika ini pesan pertama
    if (isFirstMessage) {
        db.ref("chat").push({
            name: "SYSTEM",
            text: `${currentUserName} baru saja bergabung!`,
            time: Date.now(),
            system: true // Penanda pesan sistem
        });
    }

    // Perbarui status pengguna di Firebase
    userRef.set({
        name: currentUserName,
        video: videoTitle,
        last_online: Date.now(),
        sessionId: SESSION_ID // Tambahkan ID sesi agar mudah dikenali
    });
}


// --- CHAT DAN PENGUNCINAN NAMA ---

sendBtn.onclick = () => {
    // 1. Ambil dan bersihkan input
    let name = usernameInput.value.trim();
    const text = input.value.trim();
    
    if (text === "") return;

    let isFirstMessage = false;
    
    // 2. Logika Penguncian Nama
    if (!localStorage.getItem('locked_username')) {
        // Jika nama belum terkunci dan ini pesan pertama
        if (name === "" || name.includes("Anonim") || name.length < 3) {
            // Validasi sederhana, paksa nama minimal 3 karakter
            usernameInput.placeholder = "Nama minimal 3 karakter!";
            return;
        }
        currentUserName = name;
        lockUsername(currentUserName);
        isFirstMessage = true;
    } else {
        // Gunakan nama yang sudah terkunci
        name = currentUserName;
    }
    
    // 3. Kirim pesan ke Firebase
    db.ref("chat").push({
        name: name,
        text: text,
        time: Date.now()
    });
    
    // 4. Perbarui status pengguna (termasuk notifikasi join jika ini pesan pertama)
    trackUserStatus(currentMediaTitle, isFirstMessage);

    input.value = "";
};

// Tampilkan pesan realtime
db.ref("chat").on("child_added", snapshot => {
    const msg = snapshot.val();
    const div = document.createElement("div");

    // Periksa apakah ini pesan sistem
    if (msg.system) {
        div.className = 'msg system-msg'; // Gunakan kelas baru untuk pesan sistem
        div.textContent = msg.text;
    } else {
        // Pesan chat biasa
        const timeStr = new Date(msg.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        div.className = 'msg';
        div.innerHTML = `<strong>${msg.name}</strong> <span style="font-size: 0.7em; opacity: 0.6;">(${timeStr})</span>: ${msg.text}`;
    }

    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});


// --- PELACAKAN PENGGUNA AKTIF REAL-TIME ---

db.ref("users").on("value", snapshot => {
    const users = snapshot.val();
    usersContainer.innerHTML = '';
    
    if (users) {
        const userList = Object.keys(users).map(key => users[key]);
        
        // Filter pengguna yang aktif dalam 5 menit terakhir
        const activeUsers = userList.filter(user => (Date.now() - user.last_online) < (5 * 60 * 1000));
        
        if (activeUsers.length === 0) {
            usersContainer.innerHTML = '<p style="color: #999; text-align: center; font-size: 0.9em;">Saat ini hanya Anda yang aktif.</p>';
            return;
        }

        activeUsers.forEach(user => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'user-status-item';

            // Nama pengguna
            const nameSpan = document.createElement('span');
            nameSpan.className = 'status-name';
            nameSpan.textContent = user.name + (user.sessionId === SESSION_ID ? ' (Anda)' : ''); // Tambahkan (Anda)
            
            // Video yang ditonton
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


// --- MEDIA DARI GITHUB (DIUBAH UNTUK MELACAK VIDEO) ---
const MEDIA_URL = "https://raw.githubusercontent.com/juju170/bakat-showcase/main/data.json";

fetch(MEDIA_URL)
    .then(async res => {
        if (!res.ok) {
            throw new Error(`Gagal memuat file dari URL. Status HTTP: ${res.status}`);
        }
        try {
            return await res.json();
        } catch (e) {
            const rawText = await res.text();
            console.error("RESPONS MENTAH (JIKA BUKAN JSON):", rawText.substring(0, 200) + '...');
            throw new Error(`Gagal mengurai JSON. Error teknis: ${e.message}`);
        }
    })
    .then(data => {
        const playerDiv = document.getElementById("player");
        const mediaContainerDiv = document.getElementById("mediaContainer");
        
        // Ambil array dari properti 'media'
        mediaData = data.media || []; 

        if (mediaData.length > 0) {
            // 1. Muat media acak di Player
            const random = mediaData[Math.floor(Math.random() * mediaData.length)];
            
            playerDiv.innerHTML = ''; // Hapus pesan "Memuat media..."

            loadAndTrackMedia(random, playerDiv); // Panggil fungsi baru

            // 2. Menampilkan Daftar Media
            mediaContainerDiv.innerHTML = '';
            mediaData.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'media-item';
                itemDiv.textContent = `${item.judul} (${item.nama}) - ${item.tipe}`;
                // Tambahkan event click untuk memuat media jika diklik
                itemDiv.onclick = () => loadAndTrackMedia(item, playerDiv);
                mediaContainerDiv.appendChild(itemDiv);
            });


        } else {
            playerDiv.innerHTML = "<p>Daftar media kosong.</p>";
            mediaContainerDiv.textContent = "Daftar kosong.";
            // Perbarui status: tidak menonton
            currentMediaTitle = "Tidak Ada Media";
            trackUserStatus(currentMediaTitle, false);
        }
    })
    .catch(err => {
        // Pesan error di UI, termasuk detail error
        document.getElementById("player").innerHTML = `<p style="color: red; padding: 10px;">❌ Gagal ambil media! Cek: 1. Koneksi internet. 2. URL media. 3. Format file JSON. (${err.message})</p>`;
        console.error("Gagal ambil media (Kesalahan Fetch/Parsing):", err);
        // Perbarui status: Error
        currentMediaTitle = "Error Memuat Media";
        trackUserStatus(currentMediaTitle, false);
    });

// Fungsi untuk memuat media yang diklik dari daftar, diganti dengan fungsi baru
function loadAndTrackMedia(item, playerDiv) {
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
    
    // Perbarui status video yang sedang ditonton
    currentMediaTitle = item.judul;
    trackUserStatus(currentMediaTitle, false);
}

