# NeuroPath

NeuroPath adalah platform bimbingan konseling (BK) karier digital untuk siswa SMA dan guru BK di Indonesia. Platform ini menggantikan tes karier pilihan ganda yang kaku dengan wawancara AI berbasis suara secara real-time yang memetakan dimensi kognitif siswa, lalu menyusun hasilnya menjadi rencana aksi yang personal dan dapat dieksekusi.

## Pengenalan

Siswa yang akan lulus SMA diharapkan memilih jalur karier dengan hampir tanpa panduan. Tes karier standar mengandalkan kuesioner yang kaku dan menghasilkan rekomendasi yang umum serta abstrak. NeuroPath melakukan percakapan yang alami dengan siswa, menganalisis minat, bakat, dan pola komunikasi mereka lintas enam dimensi kognitif, mengidentifikasi arketipe utama, kemudian menghasilkan:

- peta jalan (roadmap) karier yang personal dengan pencapaian (milestone) yang rinci dan dapat dilacak;
- umpan langsung (live feed) AI yang menganalisis lintasan perkembangan pengguna secara berkelanjutan;
- keluaran yang terarah, seperti portfolio, surat lamaran (cover letter), dan sumber belajar;
- sertifikat penyelesaian on-chain (token ERC-721) yang dapat diverifikasi oleh siapa pun.

Platform ini mendukung dua bahasa (Indonesia dan Inggris) serta menyediakan tema terang dan gelap.

## Fitur

- **Wawancara Karier AI** — sesi suara atau teks dengan sintesis suara (text-to-speech) dan pengenalan suara hands-free; memetakan enam dimensi kognitif dan arketipe.
- **Live AI Agent** — feed di dashboard dengan analisis yang disesuaikan dengan perkembangan pengguna.
- **Roadmap Karier Personal** — rencana aksi yang dapat diperluas dengan milestone terukur dan sumber belajar.
- **Pencarian Terpadu** — satu kueri untuk jurnal, milestone roadmap, dan daftar lowongan kerja.
- **Hasil Sesuai Kebutuhan** — pembuatan portfolio, cover letter, dan sumber belajar secara otomatis oleh AI.
- **Jurnal Konselor** — pencatatan untuk guru BK dalam mendampingi setiap siswa.
- **Kredensial Blockchain** — sertifikat penyelesaian sebagai token ERC-721 yang dapat diverifikasi di `/verify`.
- **Dwi-Bahasa** — dukungan penuh bahasa Indonesia dan Inggris dengan pengalihan bahasa.

## Teknologi

- **Framework**: Next.js 16 (App Router), React 19
- **Backend**: Next.js API routes, Firebase (Auth + Firestore)
- **AI**: Google Generative AI dan Groq melalui router, dengan respons streaming
- **Blockchain**: Hardhat, OpenZeppelin, token ERC-721 di jaringan testnet Sepolia
- **3D dan Animasi**: Three.js, react-three-fiber, framer-motion

## Instalasi

Prasyarat: Node.js 20 atau lebih baru dan akun Firebase.

```bash
# 1. Clone repository
git clone https://github.com/GlorysID/NeuroPath.git
cd NeuroPath

# 2. Instal dependensi
npm install

# 3. Buat file lingkungan dan isi kredensial Anda
cp .env.local.example .env.local
```

Variabel lingkungan yang dibutuhkan:

| Variabel          | Deskripsi                                          |
| ----------------- | -------------------------------------------------- |
| `GROQ_API_KEY`    | Kunci API Groq untuk route agen AI                 |
| `AI_ROUTER_URL`   | URL dasar AI router                                |
| `AI_ROUTER_KEY`   | Kunci autentikasi AI router                        |
| `AI_ROUTER_MODEL` | Nama model yang digunakan oleh router              |
| `JSEARCH_API_KEY` | Kunci API JSearch untuk lowongan kerja langsung    |
| `SEPOLIA_RPC_URL` | Endpoint RPC Sepolia untuk interaksi kontrak       |
| `PRIVATE_KEY`     | Kunci privat dompet untuk minter kredensial        |

Konfigurasi web Firebase berada di `src/lib/firebase.js`. Buat aplikasi web di konsol Firebase Anda, lalu tempel kredensialnya di file tersebut.

## Penggunaan

```bash
npm run dev
```

Buka http://localhost:3000.

Alur inti:

1. **Login / Daftar** — buat akun dengan email dan kata sandi.
2. **Wawancara AI (Pemetaan Saraf)** (`/interview`) — selesaikan wawancara AI dalam mode suara atau teks. AI memetakan dimensi kognitif dan menentukan arketipe.
3. **Dashboard** (`/dashboard`) — tinjau peta kognitif (grafik radar), umpan agen AI langsung, serta tindakan cepat yang disarankan.
4. **Roadmap Karier** (`/dashboard/roadmap`) — telusuri milestone yang dibuat sesuai arketipe; buka sebuah milestone untuk memuat sumber belajar.
5. **Kredensial** — setelah roadmap diselesaikan, cetak sertifikat NeuroPath sebagai NFT dan bagikan tautan verifikasi (`/verify`).

Aksi lain dari dashboard: membuat portfolio, mencari pekerjaan yang cocok beserta cover letter, dan menggunakan pencarian terpadu di jurnal serta lowongan.

## Script NPM

| Script                              | Tujuan                              |
| ----------------------------------- | ----------------------------------- |
| `npm run dev`                       | Menjalankan server pengembangan     |
| `npm run build`                     | Build untuk produksi                |
| `npm run lint`                      | Menjalankan ESLint                  |
| `npx hardhat test`                  | Menjalankan tes kontrak sertifikat  |
| `npx hardhat run scripts/deploy.js` | Deploy kontrak sertifikat           |
| `node scripts/upgrade_db.js`        | Utilitas migrasi Firestore sekali pakai |

## Struktur Proyek

```
contracts/            Kontrak Solidity kredensial (ERC-721)
scripts/              Skrip deploy dan migrasi
src/app/              App Router Next.js (halaman, layout)
src/app/api/          Route server: agent, interview, search, portfolio, mint, verify, ...
src/app/components/   Komponen UI (toggle, chart, widget, 3D)
src/app/context/      Provider bahasa dan tema
src/lib/              Binding AI, Firebase, dan layanan pekerjaan
public/               Aset statis (gambar, model 3D)
```

## Kredit

- Dikelola oleh [GlorysID](https://github.com/GlorysID).
- Dibangun dengan Next.js, Firebase, Groq, Google Generative AI, Hardhat, dan Three.js.

## Deploy di Vercel

Push ke GitHub dari branch `main`, lalu import repository di dashboard Vercel, atau deploy langsung dari CLI:

```bash
npx vercel login
npx vercel --prod
```

Tambahkan variabel lingkungan pada bagian Instalasi ke pengaturan project Vercel sebelum deploy. Proyek sudah menyertakan `vercel.json` dengan pengaturan build yang dibutuhkan.

## Dokumentasi

- `PRODUCT.md` — spesifikasi produk, pengguna sasaran, dan prinsip desain.
