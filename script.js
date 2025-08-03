// Import the Firebase libraries and your config
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getFirestore, collection, onSnapshot, updateDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';

// Your Firebase configuration (copy this from the firebase-config.js file)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// The rest of your script.js code remains the same, but with a few minor changes
// in the way you call the Firestore functions.

const contentContainer = document.getElementById("content-container");

// Function to render a specific page
function showPage(pageName) {
  contentContainer.innerHTML = ""; // Clear current content

  switch (pageName) {
    case "home":
      renderHomePage();
      break;
    case "classroom1":
      renderClassroomPage("classroom1");
      break;
    case "classroom2":
      renderClassroomPage("classroom2");
      break;
    case "classroom3":
      renderClassroomPage("classroom3");
      break;
  }
}

// Render the homepage
function renderHomePage() {
  contentContainer.innerHTML = `
    <h2>Welcome to the Attendance Dashboard!</h2>
    <p>Use the navigation above to view and manage attendance for each classroom.</p>
  `;
}

// Render a classroom page
function renderClassroomPage(classroom) {
  contentContainer.innerHTML = `
    <h2>${classroom.toUpperCase().replace("-", " ")}</h2>
    <input type="text" id="search-bar" placeholder="Search students..." />
    <div id="student-list"></div>
  `;

  // Fetch student data from Firebase
  onSnapshot(collection(db, classroom), (snapshot) => {
    const studentListDiv = document.getElementById("student-list");
    studentListDiv.innerHTML = ""; // Clear list before re-rendering
    snapshot.forEach((doc) => {
      const student = doc.data();
      const studentId = doc.id;
      const studentDiv = document.createElement("div");

      // Check if lastUpdated exists and format it
      const lastUpdatedTimestamp = student.lastUpdated
        ? new Date(student.lastUpdated.seconds * 1000).toLocaleString()
        : "Never";

      studentDiv.innerHTML = `
        <p>${student.name} - Status: ${student.checkedIn ? "Checked In" : "Checked Out"}</p>
        <p>Last Updated: ${lastUpdatedTimestamp}</p>
        <button onclick="checkIn('${classroom}', '${studentId}')">Check In</button>
        <button onclick="checkOut('${classroom}', '${studentId}')">Check Out</button>
        <button onclick="applySunscreen('${classroom}', '${studentId}')">Sunscreen</button>
      `;
      studentListDiv.appendChild(studentDiv);
    });
  });
}

// Firebase functions to update attendance
function checkIn(classroom, studentId) {
  updateDoc(doc(db, classroom, studentId), {
    checkedIn: true,
    lastUpdated: serverTimestamp(),
  });
}

function checkOut(classroom, studentId) {
  updateDoc(doc(db, classroom, studentId), {
    checkedIn: false,
    lastUpdated: serverTimestamp(),
  });
}

function applySunscreen(classroom, studentId) {
  alert(`Sunscreen applied for ${studentId} in ${classroom}`);
}

// Initial page load
showPage("home");

document.addEventListener("input", (e) => {
  if (e.target.id === "search-bar") {
    // Search logic here
  }
});
