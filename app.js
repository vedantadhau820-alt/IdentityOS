/* =========================================================
   PROJECT 90 - MULTI USER SAFE VERSION
   Firestore Structure:
   users/{userId}/logs/{yyyy-mm-dd}
   ========================================================= */


/* ================= FIREBASE SETUP ================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});


/* ================= GLOBAL STATE ================= */

const today = new Date().toISOString().split("T")[0];

let userId = localStorage.getItem("identityUserId");
let courageUnderFear = parseInt(localStorage.getItem("courageUnderFear")) || 0;
let personalBests = JSON.parse(localStorage.getItem("personalBests")) || {};


/* ================= USER ID SYSTEM ================= */

function generateUserId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const randomLetter = letters[Math.floor(Math.random() * letters.length)];
  const randomNumbers = Math.floor(10000 + Math.random() * 90000);
  return randomLetter + randomNumbers;
}

if (!userId) {
  userId = generateUserId();
  localStorage.setItem("identityUserId", userId);
}


/* ================= HELPER FUNCTIONS ================= */

function userLogRef(dateKey) {
  return doc(db, "users", userId, "logs", dateKey);
}

async function safeGet(dateKey) {
  try {
    return await getDoc(userLogRef(dateKey));
  } catch {
    return null;
  }
}

function disableButton(type) {
  const btn = document.getElementById(type + "Btn");
  if (!btn) return;
  btn.innerText = "Completed";
  btn.disabled = true;
  btn.style.opacity = "0.5";
}


/* ================= INITIALIZATION ================= */

document.addEventListener("DOMContentLoaded", async () => {

  document.getElementById("todayDate").innerText = "Today: " + today;
  document.getElementById("userIdDisplay").innerText = "User ID: " + userId;
  document.getElementById("courageDisplay").innerText = courageUnderFear;

  setupSliders();

  await loadToday();
  await calculateStreak();
  await calculateWeeklyWorkoutRating();
});


/* ================= SLIDERS ================= */

function setupSliders() {

  const sliderPairs = [
    ["intensityInput", "intensityValue"],
    ["socialIntensity", "socialIntensityValue"]
  ];

  sliderPairs.forEach(([sliderId, valueId]) => {
    const slider = document.getElementById(sliderId);
    const value = document.getElementById(valueId);

    if (slider && value) {
      value.innerText = slider.value;
      slider.addEventListener("input", () => {
        value.innerText = slider.value;
      });
    }
  });
}


/* ================= LOAD TODAY ================= */

async function loadToday() {

  const snap = await safeGet(today);
  if (!snap || !snap.exists()) return;

  const data = snap.data();

  if (data.stability) disableButton("stability");
  if (data.workout) disableButton("workout");
  if (data.social) disableButton("social");

  if (data.strategicScore) {
    document.getElementById("strategicScoreDisplay").innerText = data.strategicScore;
  }
}


/* ================= STREAK SYSTEM ================= */

async function calculateStreak() {

  let streak = 0;
  let date = new Date();

  while (true) {

    const dateKey = date.toISOString().split("T")[0];
    const snap = await safeGet(dateKey);

    if (!snap || !snap.exists()) break;

    const data = snap.data();

    if (data.stability && data.workout && data.social) {
      streak++;
      date.setDate(date.getDate() - 1);
    } else break;
  }

  document.getElementById("streakDisplay").innerText = streak;
}


/* ================= STABILITY ================= */

window.startBreathing = () => {

  const circle = document.getElementById("breathingCircle");
  const text = document.getElementById("breathingText");
  const reflection = document.getElementById("reflectionSection");

  let cycles = 0;

  function cycle() {

    if (cycles >= 5) {
      text.innerText = "Observe. Do not react.";

      setTimeout(() => {
        text.innerText = "Now Reflect.";
        reflection.style.display = "block";
      }, 15000);

      return;
    }

    text.innerText = "Inhale...";
    circle.classList.add("breathe-in");
    circle.classList.remove("breathe-out");

    setTimeout(() => {
      text.innerText = "Exhale...";
      circle.classList.add("breathe-out");
      circle.classList.remove("breathe-in");
    }, 4000);

    setTimeout(() => {
      cycles++;
      cycle();
    }, 10000);
  }

  cycle();
};

window.completeStability = async () => {

  const situation = document.getElementById("situationInput").value;
  const reframe = document.getElementById("reframeSelect").value;
  const intensity = parseInt(document.getElementById("intensityInput").value);
  const trigger = document.getElementById("triggerSelect").value;
  const action = document.getElementById("actionInput").value;
  const secondOrder = document.getElementById("secondOrderInput").value;

  if (!situation || !action) return alert("Complete all fields.");

  let strategicScore = 2;
  if (reframe === "challenge") strategicScore += 2;
  if (intensity <= 4) strategicScore += 2;

  await setDoc(userLogRef(today), {
    stability: true,
    strategicScore,
    stabilityData: {
      situation,
      trigger,
      reframe,
      intensity,
      action,
      secondOrder,
      timestamp: new Date()
    }
  }, { merge: true });

  document.getElementById("strategicScoreDisplay").innerText = strategicScore;
  disableButton("stability");
  calculateStreak();
};


/* ================= WORKOUT ================= */

let workoutStartTime;
let workoutInterval;

window.startWorkout = () => {

  workoutStartTime = Date.now();

  document.getElementById("startWorkoutBtn").style.display = "none";
  document.getElementById("finishWorkoutBtn").style.display = "inline-block";

  workoutInterval = setInterval(() => {

    const elapsed = Date.now() - workoutStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    document.getElementById("workoutTimer").innerText =
      `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

  }, 1000);
};

window.finishWorkout = async () => {

  clearInterval(workoutInterval);

  const duration = Math.floor((Date.now() - workoutStartTime) / 60000);
  const type = document.getElementById("workoutType").value;

  let score = 2;
  if (duration >= 20) score += 2;
  if (duration >= 40) score += 2;

  await setDoc(userLogRef(today), {
    workout: true,
    workoutScore: score,
    workoutData: { type, duration, timestamp: new Date() }
  }, { merge: true });

  document.getElementById("workoutResult").innerText =
    `Completed ${duration} min | Score: ${score}`;

  disableButton("workout");
  calculateStreak();
  calculateWeeklyWorkoutRating();
};


/* ================= WEEKLY WORKOUT ================= */

async function calculateWeeklyWorkoutRating() {

  let count = 0;
  let date = new Date();

  for (let i = 0; i < 7; i++) {

    const dateKey = date.toISOString().split("T")[0];
    const snap = await safeGet(dateKey);

    if (snap && snap.exists() && snap.data().workout) count++;

    date.setDate(date.getDate() - 1);
  }

  let rating =
    count === 0 ? "Weak Week" :
    count <= 2 ? "Low Output" :
    count <= 4 ? "Solid" :
    "Operator Mode";

  document.getElementById("weeklyWorkoutRating").innerText =
    `${count}/7 Workouts – ${rating}`;
}


/* ================= SOCIAL ================= */

window.startSocialMission = () => {
  document.getElementById("startSocialBtn").style.display = "none";
  document.getElementById("missionActive").style.display = "block";
};

window.openReflection = () => {
  document.getElementById("missionActive").style.display = "none";
  document.getElementById("socialReflection").style.display = "block";
};

window.completeSocialMission = async () => {

  const difficulty = parseInt(document.getElementById("socialDifficulty").value);
  const intensity = parseInt(document.getElementById("socialIntensity").value);
  const outcome = document.getElementById("socialOutcome").value;

  if (!outcome) return alert("Describe what happened.");

  let score = 2 + difficulty * 2;
  if (intensity <= 4) score += 2;

  if (intensity >= 6) {
    courageUnderFear++;
    localStorage.setItem("courageUnderFear", courageUnderFear);
    document.getElementById("courageDisplay").innerText = courageUnderFear;
  }

  await setDoc(userLogRef(today), {
    social: true,
    socialScore: score
  }, { merge: true });

  document.getElementById("socialResult").innerText =
    `Mission Complete | Courage Score: ${score}`;

  disableButton("social");
  calculateStreak();
};


/* ================= OBSERVER ================= */

window.startObserverMode = () => {

  document.getElementById("startObserverBtn").style.display = "none";
  document.getElementById("observerActive").style.display = "block";

  let seconds = 20;
  const timer = document.getElementById("observerTimer");

  const interval = setInterval(() => {

    timer.innerText = `Observe silently... ${seconds}s`;
    seconds--;

    if (seconds < 0) {
      clearInterval(interval);
      document.getElementById("observerActive").style.display = "none";
      document.getElementById("observerQuestions").style.display = "block";
    }

  }, 1000);
};

window.completeObserverMode = async () => {

  await setDoc(userLogRef(today), {
    observer: true
  }, { merge: true });

  document.getElementById("observerResult").innerText =
    "Target locked. Enter sharp.";

  calculateStreak();
};