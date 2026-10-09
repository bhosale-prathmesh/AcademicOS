import { db } from "../core/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { safeTaskStatus } from "./dataEngine.js";

export async function listGroupTasks(groupId) {
  const snapshot = await getDocs(
    collection(db, "groups", groupId, "tasks")
  );

  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data()
  }));
}

export async function getTaskProgress(groupId, taskId, uid) {
  const snap = await getDoc(
    doc(db, "groups", groupId, "tasks", taskId, "progress", uid)
  );
  return snap.exists() ? snap.data() : null;
}

export async function setTaskProgress(groupId, taskId, uid, status) {
  const safeStatus = safeTaskStatus(status);
  await setDoc(
    doc(db, "groups", groupId, "tasks", taskId, "progress", uid),
    {
      status: safeStatus,
      updatedAt: serverTimestamp(),
      completedAt: safeStatus === "completed" ? serverTimestamp() : null
    },
    { merge: true }
  );
}

export async function getSubmission(groupId, taskId, uid) {
  const snap = await getDoc(
    doc(db, "groups", groupId, "tasks", taskId, "submissions", uid)
  );
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function submitWork(groupId, taskId, uid, content) {
  await setDoc(
    doc(db, "groups", groupId, "tasks", taskId, "submissions", uid),
    {
      status: "submitted",
      content: content.trim(),
      submittedAt: serverTimestamp(),
      reviewStatus: "pending",
      feedback: "",
      reviewedBy: null,
      reviewedAt: null
    },
    { merge: true }
  );
}

export async function reviewSubmission(
  groupId,
  taskId,
  studentUid,
  reviewerUid,
  reviewStatus,
  feedback
) {
  if (!["accepted", "needs_revision"].includes(reviewStatus)) {
    throw new Error("INVALID_REVIEW_STATUS");
  }

  await setDoc(
    doc(db, "groups", groupId, "tasks", taskId, "submissions", studentUid),
    {
      reviewStatus,
      feedback: feedback.trim(),
      reviewedBy: reviewerUid,
      reviewedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function loadMemberProgressMatrix(groupId, taskIds, memberUids) {
  const matrix = new Map();

  await Promise.all(
    taskIds.map(async taskId => {
      const statuses = await Promise.all(
        memberUids.map(uid => getTaskProgress(groupId, taskId, uid))
      );
      const row = new Map();
      memberUids.forEach((uid, index) => {
        row.set(uid, statuses[index]?.status || "pending");
      });
      matrix.set(taskId, row);
    })
  );

  return matrix;
}

export async function countUserGroupAssignmentProgress(user, joinedGroupIds) {
  const groups = [];

  for (const groupId of joinedGroupIds) {
    const groupSnap = await getDoc(doc(db, "groups", groupId));
    if (!groupSnap.exists()) continue;

    const tasks = await listGroupTasks(groupId);
    let completed = 0;

    for (const task of tasks) {
      const progress = await getTaskProgress(groupId, task.id, user.uid);
      if (progress?.status === "completed") completed += 1;
    }

    groups.push({
      name: groupSnap.data().name || "Unnamed group",
      total: tasks.length,
      completed
    });
  }

  return groups;
}