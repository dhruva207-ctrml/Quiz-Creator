import { getApp, getApps, initializeApp } from "firebase/app";
import {
  get,
  getDatabase,
  push,
  ref,
  serverTimestamp,
  set,
} from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  const missingConfig = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missingConfig.join(", ")}. Set the values in .env.local.`,
    );
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return getDatabase(app);
}

export async function getQuizQuestions() {
  const snapshot = await get(ref(getDb(), "quizQuestions"));
  const records = snapshot.val();

  if (records === null) {
    return [];
  }

  if (typeof records !== "object" || Array.isArray(records)) {
    throw new Error("The quizQuestions data has an invalid format.");
  }

  return Object.entries(records).map(([id, record]) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new Error(`Quiz question ${id} has an invalid format.`);
    }

    return { ...record, id };
  });
}

export async function saveQuizQuestion({ question, options, correctAnswer }) {
  const normalizedQuestion =
    typeof question === "string" ? question.trim() : "";
  const normalizedOptions =
    options && typeof options === "object"
      ? Object.fromEntries(
          ["A", "B", "C", "D"].map((key) => [
            key,
            typeof options[key] === "string" ? options[key].trim() : "",
          ]),
        )
      : {};

  if (!normalizedQuestion) {
    throw new Error("Enter a quiz question.");
  }

  const missingOptions = Object.entries(normalizedOptions)
    .filter(([, value]) => !value)
    .map(([key]) => `Option ${key}`);

  if (missingOptions.length > 0) {
    throw new Error(`Complete all options: ${missingOptions.join(", ")}.`);
  }

  if (!["A", "B", "C", "D"].includes(correctAnswer)) {
    throw new Error("Choose a correct answer.");
  }

  const questionRef = push(ref(getDb(), "quizQuestions"));

  await set(questionRef, {
    question: normalizedQuestion,
    options: normalizedOptions,
    correctAnswer,
    createdAt: serverTimestamp(),
  });

  return questionRef.key;
}
