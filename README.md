# MindAI: AI-Powered Somatic & Visual Emotional Interpreter for Alexithymia 🧠✨

MindAI adalah aplikasi web interaktif (_Single-Page Interface_) yang membantu pengguna mengenali kondisi emosional melalui pendekatan somatik, metafora visual, dan interpretasi AI berbasis Google Gemini.

Aplikasi ini dirancang untuk mendukung pengguna yang kesulitan menamai emosi secara langsung. Alurnya dimulai dari onboarding visual, lalu bergerak ke chat, dashboard analitik, resources, dan settings yang semuanya tersimpan di browser melalui `localStorage`.

## Fitur Utama

- **Mood Canvas**: onboarding non-verbal berbasis warna dan analogi cuaca.
- **AI Emotional Interpreter Chatbot**: chat assistant dengan gaya respons singkat, hangat, dan somatik.
- **Reflective Dashboard**: visualisasi emosi dalam bentuk chart, word cloud, dan daftar most common emotions.
- **Somatic Coping Strategy Cards**: kartu regulasi sistem saraf seperti Box Breathing dan Grounding.
- **Clear Data Control**: penghapusan chat history, emotion logs, dan analytics langsung dari settings.
- **Personalized Profile**: nama user disimpan di `localStorage` supaya sapaan AI terasa lebih personal.
- **Demo API Notice**: aplikasi menampilkan notifikasi jika API key belum ada di `localStorage`, karena input key dibutuhkan untuk demo chat AI.
- **Persistent Context**: histori chat, label emosi, dan metadata ekstraksi disimpan di `localStorage` agar bisa dipakai lagi untuk prompt berikutnya.

## Flow Aplikasi

1. Buka aplikasi melalui `src/index.html`.
2. Lihat splash screen lalu masuk ke dashboard.
3. Gunakan hero / onboarding visual untuk mengenali kondisi awal.
4. Lanjut ke chat untuk berinteraksi dengan MindAI.
5. Buka dashboard untuk melihat trend mood, emotion frequency, word cloud, dan most common emotions.
6. Masuk ke settings untuk mengatur API key, menghapus data, atau memeriksa status penyimpanan.

Untuk deployment Vercel, route tambahan tersedia di `src/pages/` dan setiap halaman akan redirect ke state yang sesuai di `src/index.html`.

## Tech Stack

- **Frontend**: HTML5, vanilla CSS
- **Logic & State**: Vanilla JavaScript (ES6) + `localStorage`
- **AI Integration**: Google Gemini API via direct client-side REST fetch
- **Visualization**: Chart.js dan WordCloud.js

## Instalasi Lokal

Proyek ini menggunakan arsitektur _zero-bundler_, jadi tidak perlu `npm install`.

1. Clone repositori ini atau ekstrak file source code.
2. Buka `src/index.html` langsung di browser, atau jalankan via ekstensi Live Server di VS Code.
3. Pastikan koneksi internet aktif jika ingin memuat library CDN dan Gemini API.

## Cara Mendapatkan Gemini API Key

1. Buka Google AI Studio: https://aistudio.google.com/
2. Login dengan akun Google Anda.
3. Buat atau pilih project yang akan digunakan.
4. Masuk ke menu untuk membuat API key Gemini.
5. Salin API key yang dihasilkan.

## Cara Menginput API Key ke Web

1. Buka aplikasi MindAI.
2. Scroll atau pindah ke halaman **Settings**.
3. Masukkan API key pada field **Gemini API Key**.
4. Klik **Save API Key**.
5. Key akan disimpan di browser melalui `localStorage` dan diprioritaskan saat aplikasi membaca konfigurasi.
6. Isi juga nama Anda di bagian Profile supaya sapaan MindAI lebih personal.

Jika Anda ingin menghapus key dari browser, klik **Clear Key**.

## API Key Saat Testing

MindAI sekarang hanya memakai API key yang disimpan di `localStorage` melalui settings aplikasi. Jika key belum ada, chat AI akan menampilkan notifikasi demo agar Anda mengisinya terlebih dahulu.

## Penyimpanan Data

MindAI menyimpan data berikut di browser:

- `mindai_chat_history`
- `mindai_emotion_logs`
- `mindai_emotion_extraction_meta`
- `mindai_gemini_key`

Tombol **Clear Data** di settings akan menghapus seluruh data chat, label emosi, dan analytics, tetapi tidak menghapus Gemini API key.

## Testing

Repository ini menyediakan test runner berbasis browser di folder `test/`.

- Buka `test/index.html` di browser.
- Test mencakup unit test dan integration test untuk flow aplikasi, localStorage, mobile layout, clear-data behavior, dan wordcloud rendering.

## Catatan

- Word cloud dashboard akan menyesuaikan ukuran container secara otomatis.
- Tampilan mobile memakai sidebar off-canvas agar navbar tetap ringkas dan tidak overflow.
- Hero image menggunakan aset lokal `src/assets/deep-cf_bq1xp6wk-unsplash.jpg`.
