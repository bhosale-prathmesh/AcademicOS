import { db } from "../core/firebase-config.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { safeTaskStatus } from "./dataEngine.js";

export async function listPersonalTasks(uid) {
  const snapshot = await getDocs(
    collection(db, "users", uid, "personalTasks")
  );

  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data()
  }));
}

export async function createPersonalTask(uid, payload) {
  const ref = doc(collection(db, "users", uid, "personalTasks"));
  const status = safeTaskStatus(payload.status || "pending");

  await setDoc(ref, {
    title: payload.title?.trim() || "Untitled task",
    description: payload.description?.trim() || "",
    subject: payload.subject?.trim() || "",
    priority: payload.priority || "medium",
    dueDate: payload.dueDate || null,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: status === "completed" ? serverTimestamp() : null
  });

  return ref.id;
}

export async function updatePersonalTask(uid, taskId, payload) {
  const ref = doc(db, "users", uid, "personalTasks", taskId);
  const status = payload.status
    ? safeTaskStatus(payload.status)
    : undefined;

  const data = {
    updatedAt: serverTimestamp()
  };

  if (payload.title !== undefined) data.title = payload.title.trim();
  if (payload.description !== undefined) {
    data.description = payload.description.trim();
  }
  if (payload.subject !== undefined) data.subject = payload.subject.trim();
  if (payload.priority !== undefined) data.priority = payload.priority;
  if (payload.dueDate !== undefined) data.dueDate = payload.dueDate || null;
  if (status) {
    data.status = status;
    data.completedAt = status === "completed"
      ? serverTimestamp()
      : null;
  }

  await updateDoc(ref, data);
}

export async function deletePersonalTask(uid, taskId) {
  await deleteDoc(doc(db, "users", uid, "personalTasks", taskId));
}
