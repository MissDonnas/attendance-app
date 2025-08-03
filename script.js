// Import the Firebase libraries as modules from a CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getFirestore, collection, onSnapshot, updateDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDZYW4AQXyCtkB2mUMN-QIsc57ZwjvlsE",
  authDomain: "attendance-app-1b27e.firebaseapp.com",
  projectId: "attendance-app-1b27e",
  storageBucket: "attendance-app-1b27e.firebasestorage.app",
  messagingSenderId: "1043261702908",
  appId: "1:1043261702908:web:a29f90f3fb11c47476cd79",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
