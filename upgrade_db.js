import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function upgradeRoadmaps() {
  const usersSnap = await getDocs(collection(db, "users"));
  
  const dummyMilestones = [
    { title: "Penguasaan Python Dasar", description: "Memahami sintaks dasar, struktur data, dan fungsi dalam Python." },
    { title: "Eksplorasi Library Data", description: "Menggunakan Pandas dan NumPy untuk manipulasi dataset tabular." },
    { title: "Visualisasi Metrik", description: "Membangun grafik dasar menggunakan Matplotlib dan Seaborn." },
    { title: "Pemahaman SQL", description: "Melakukan query dasar (SELECT, JOIN, GROUP BY) ke database relasional." },
    { title: "Analisis Statistik Dasar", description: "Menerapkan probabilitas dan pengujian hipotesis pada data nyata." },
    { title: "Machine Learning 101", description: "Memahami konsep supervised learning dan regresi linier." },
    { title: "Proyek EDA Mandiri", description: "Mengerjakan Exploratory Data Analysis pada dataset Kaggle." },
    { title: "Pengenalan Deep Learning", description: "Mempelajari dasar-dasar Neural Network dengan TensorFlow/Keras." },
    { title: "Optimasi Model", description: "Melakukan hyperparameter tuning untuk meningkatkan akurasi prediksi." },
    { title: "Senior Data Scientist", description: "Tujuan akhir: Mampu memimpin proyek data end-to-end dengan dampak bisnis." }
  ];

  let updated = 0;
  usersSnap.forEach(async (userDoc) => {
    const data = userDoc.data();
    if (data.profile) {
      await updateDoc(doc(db, "users", userDoc.id), {
        "profile.milestones": dummyMilestones
      });
      updated++;
    }
  });

  console.log(`Updated ${updated} users with 10-step roadmap.`);
}

upgradeRoadmaps().catch(console.error);
