"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  doc
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useLanguage } from "../context/LanguageContext";
import styles from "./NotesPanel.module.css";

export default function NotesPanel({ userId }) {
  const { lang } = useLanguage();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const textareaRef = useRef(null);

  const t = {
    title: lang === 'id' ? "Jurnal Bimbingan" : "Counseling Journal",
    subtitle: lang === 'id' ? "Catatan bimbingan karier pribadimu, tersimpan aman." : "Your personal career guidance notes, kept safe.",
    newEntry: lang === 'id' ? "Catatan Baru" : "New Entry",
    editingLabel: lang === 'id' ? "Mengedit Catatan" : "Editing Note",
    add: lang === 'id' ? "Simpan Catatan" : "Save Note",
    placeholderTitle: lang === 'id' ? "Judul (mis. Hasil bimbingan sesi 1)" : "Title (e.g. Counseling session 1)",
    placeholderContent: lang === 'id' ? "Tulis catatanmu di sini..." : "Write your note here...",
    save: lang === 'id' ? "Simpan" : "Save",
    saveEdit: lang === 'id' ? "Simpan Perubahan" : "Save Changes",
    cancel: lang === 'id' ? "Batal" : "Cancel",
    edit: lang === 'id' ? "Ubah" : "Edit",
    delete: lang === 'id' ? "Hapus" : "Delete",
    confirmDelete: lang === 'id' ? "Hapus catatan ini? Profil dan roadmap kamu tidak akan terpengaruh." : "Delete this note? Your profile and roadmap won't be affected.",
    empty: lang === 'id' ? "Belum ada catatan. Mulai tulis jurnal bimbingan pertamamu!" : "No notes yet. Start writing your first journal entry!",
    saving: lang === 'id' ? "Memuat..." : "Loading...",
  };

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "users", userId, "notes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setNotes(list);
      setLoading(false);
    }, (error) => {
      console.error("Notes snapshot error:", error);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [content, editingId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await addDoc(collection(db, "users", userId, "notes"), {
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("Add note error:", err);
    }
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      await updateDoc(doc(db, "users", userId, "notes", editingId), {
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date()
      });
      setEditingId(null);
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("Update note error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await deleteDoc(doc(db, "users", userId, "notes", id));
      if (editingId === id) {
        setEditingId(null);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      console.error("Delete note error:", err);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h3 className={styles.heading}>{t.title}</h3>
          <p className={styles.subtitle}>{t.subtitle}</p>
        </div>
        <span className={styles.count}>{String(notes.length).padStart(2, "0")}</span>
      </div>

      <form onSubmit={editingId ? handleUpdate : handleAdd} className={styles.form}>
        <div className={styles.formLabel}>
          <span>{editingId ? t.editingLabel : t.newEntry}</span>
          <span className={styles.formRule} />
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.placeholderTitle}
          className={styles.input}
          maxLength={120}
        />
        <div className={styles.textareaWrap}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.placeholderContent}
            className={styles.textarea}
            rows={1}
            maxLength={1000}
          />
          <span className={`${styles.charCount} ${content.length > 900 ? styles.charCountWarn : ""}`}>
            {content.length}/1000
          </span>
        </div>
        <div className={styles.formActions}>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className={styles.cancelBtn}
            >
              {t.cancel}
            </button>
          )}
          <button type="submit" className={styles.saveBtn} disabled={!title.trim() || !content.trim()}>
            {editingId ? t.saveEdit : t.add}
          </button>
        </div>
      </form>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.skeleton}>
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonLine} style={{ width: "80%" }} />
            <span className={styles.skeletonLine} style={{ width: "92%" }} />
          </div>
        ) : notes.length === 0 ? (
          <div className={styles.empty}>
            <svg className={styles.emptyIcon} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            <p className={styles.emptyText}>{t.empty}</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={styles.note}>
              <div className={styles.noteTop}>
                <h4 className={styles.noteTitle}>{note.title}</h4>
                <span className={styles.noteDate}>{formatDate(note.createdAt)}</span>
              </div>
              <p className={styles.noteContent}>{note.content}</p>
              <div className={styles.noteActions}>
                <button onClick={() => startEdit(note)} className={styles.editBtn}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                  {t.edit}
                </button>
                <button onClick={() => handleDelete(note.id)} className={styles.deleteBtn}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  {t.delete}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
