import { db } from "../core/firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

export async function createGroup(user, name, description = "") {
  const groupRef = doc(collection(db, "groups"));
  const memberRef = doc(db, "groups", groupRef.id, "members", user.uid);
  const joinedRef = doc(
    db, "users", user.uid, "joinedGroups", groupRef.id
  );

  const batch = writeBatch(db);

  batch.set(groupRef, {
    name: name.trim(),
    description: description.trim(),
    createdBy: user.uid,
    createdAt: serverTimestamp()
  });

  batch.set(memberRef, {
    uid: user.uid,
    role: "admin",
    joinedAt: serverTimestamp()
  });

  batch.set(joinedRef, {
    groupId: groupRef.id,
    joinedAt: serverTimestamp()
  });

  await batch.commit();
  return groupRef.id;
}

export async function joinGroup(user, groupId) {
  const groupRef = doc(db, "groups", groupId);
  const groupSnapshot = await getDoc(groupRef);

  if (!groupSnapshot.exists()) {
    throw new Error("GROUP_NOT_FOUND");
  }

  const memberRef = doc(db, "groups", groupId, "members", user.uid);
  const memberSnapshot = await getDoc(memberRef);

  if (memberSnapshot.exists()) {
    throw new Error("ALREADY_MEMBER");
  }

  const joinedRef = doc(db, "users", user.uid, "joinedGroups", groupId);
  const batch = writeBatch(db);

  batch.set(memberRef, {
    uid: user.uid,
    role: "student",
    joinedAt: serverTimestamp()
  });

  batch.set(joinedRef, {
    groupId,
    joinedAt: serverTimestamp()
  });

  await batch.commit();
  return groupSnapshot.data();
}

export async function listJoinedGroups(user) {
  const joinedSnapshot = await getDocs(
    collection(db, "users", user.uid, "joinedGroups")
  );

  const groups = [];

  for (const joinedDoc of joinedSnapshot.docs) {
    const groupId = joinedDoc.id;
    const groupSnapshot = await getDoc(doc(db, "groups", groupId));
    if (!groupSnapshot.exists()) continue;

    const memberSnapshot = await getDoc(
      doc(db, "groups", groupId, "members", user.uid)
    );

    groups.push({
      id: groupSnapshot.id,
      ...groupSnapshot.data(),
      myRole: memberSnapshot.exists()
        ? memberSnapshot.data().role
        : "student"
    });
  }

  return groups;
}

export async function listCreatedGroups(user) {
  const snapshot = await getDocs(
    query(collection(db, "groups"), where("createdBy", "==", user.uid))
  );

  return snapshot.docs.map(item => ({
    id: item.id,
    ...item.data(),
    myRole: "admin"
  }));
}

export async function getGroupMembership(groupId, uid) {
  const memberSnapshot = await getDoc(
    doc(db, "groups", groupId, "members", uid)
  );

  if (!memberSnapshot.exists()) return null;

  return {
    uid,
    ...memberSnapshot.data()
  };
}
