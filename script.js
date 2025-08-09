// Import the Firebase libraries as modules from a CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getFirestore, collection, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';

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

// Helper function to check if a student is scheduled for today
function isScheduledToday(studentSchedule) {
  if (!studentSchedule || studentSchedule.length === 0) {
    // If no schedule is set, assume they are scheduled every day
    return true;
  }
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[new Date().getDay()];
  return studentSchedule.includes(today);
}

// Function to render a specific page
function showPage(pageName) {
  contentContainer.innerHTML = ""; // Clear current content

  switch (pageName) {
    case "daycare":
      renderClassroomPage("daycare");
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
    default:
        // Set a default page
        renderClassroomPage("daycare");
        break;
  }
}

// Render a classroom page
function renderClassroomPage(classroom) {
  const today = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  contentContainer.innerHTML = `
    <div id="info-header">
      <div id="date-display">${formattedDate}</div>
      <div class="totals-container">
        <div class="total-card">
          <h3 id="total-count">0</h3>
          <p>Total</p>
        </div>
        <div class="total-card">
          <h3 id="present-count">0</h3>
          <p>Present</p>
        </div>
        <div class="total-card">
          <h3 id="absent-count">0</h3>
          <p>Absent</p>
        </div>
      </div>
      <div>
        <button class="reset-button" onclick="resetAllData('${classroom}')">Reset All Data</button>
      </div>
    </div>
    <div id="student-header">
      <h2>${classroom.toUpperCase().replace("-", " ")}</h2>
      <input type="text" id="search-bar" placeholder="Search students..." />
    </div>
    <div id="student-list"></div>
  `;

  // Fetch student data from Firebase
  onSnapshot(collection(db, classroom), (snapshot) => {
    const studentListDiv = document.getElementById("student-list");
    studentListDiv.innerHTML = ""; // Clear list before re-rendering

    let totalStudents = 0;
    let presentStudents = 0;
    
    snapshot.forEach((doc) => {
      const student = doc.data();
      const studentId = doc.id;
      
      const isScheduled = isScheduledToday(student.schedule);
      const attendanceStatus = student.checkedIn ? 'Present' : (isScheduled ? 'Absent' : 'Not Scheduled');
      const statusClass = student.checkedIn ? 'checked-in' : (isScheduled ? 'checked-out' : 'not-scheduled');
      
      if(isScheduled){
        totalStudents++;
        if(student.checkedIn) presentStudents++;
      }
      
      const lastCheckInTimestamp = student.lastCheckIn
        ? new Date(student.lastCheckIn.seconds * 1000).toLocaleTimeString()
        : "Never";
      const lastCheckOutTimestamp = student.lastCheckOut
        ? new Date(student.lastCheckOut.seconds * 1000).toLocaleTimeString()
        : "Never";
      const lastSunscreenTimestamp = student.lastSunscreen
        ? new Date(student.lastSunscreen.seconds * 1000).toLocaleTimeString()
        : "Never";

      const studentCard = document.createElement("div");
      studentCard.className = "student-card";

      studentCard.innerHTML = `
        <div class="student-info">
          <h4>${student.name} <span class="status-badge ${statusClass}">${attendanceStatus}</span></h4>
          <p>Last Check In: ${lastCheckInTimestamp}</p>
          <p>Last Check Out: ${lastCheckOutTimestamp}</p>
          <p>Last Sunscreen: ${lastSunscreenTimestamp}</p>
        </div>
        <div class="action-buttons">
          <button class="check-in-button" onclick="checkIn('${classroom}', '${studentId}')">Check In</button>
          <button class="check-out-button" onclick="checkOut('${classroom}', '${studentId}')">Check Out</button>
          <button class="sunscreen-button" onclick="applySunscreen('${classroom}', '${studentId}')">Sunscreen</button>
        </div>
      `;
      studentListDiv.appendChild(studentCard);
    });

    // Update totals
    document.getElementById("total-count").textContent = totalStudents;
    document.getElementById("present-count").textContent = presentStudents;
    document.getElementById("absent-count").textContent = totalStudents - presentStudents;
  });
}

// Firebase functions to update attendance
function checkIn(classroom, studentId) {
  updateDoc(doc(db, classroom, studentId), {
    checkedIn: true,
    lastCheckIn: serverTimestamp(),
  });
}

function checkOut(classroom, studentId) {
  updateDoc(doc(db, classroom, studentId), {
    checkedIn: false,
    lastCheckOut: serverTimestamp(),
  });
}

function applySunscreen(classroom, studentId) {
  updateDoc(doc(db, classroom, studentId), {
    lastSunscreen: serverTimestamp(),
  });
}

// PDF generation function for all pages
async function saveAllAsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pages = ['daycare', 'classroom1', 'classroom2', 'classroom3'];
  let isFirstPage = true;

  for (const pageName of pages) {
    if (!isFirstPage) {
      doc.addPage();
    }
    
    const studentsRef = collection(db, pageName);
    const studentsSnapshot = await getDocs(studentsRef);
    const studentData = [];

    studentsSnapshot.forEach((doc) => {
      const student = doc.data();
      studentData.push([
        student.name,
        student.checkedIn ? 'Present' : 'Absent',
        student.lastCheckIn ? new Date(student.lastCheckIn.seconds * 1000).toLocaleTimeString() : 'N/A',
        student.lastCheckOut ? new Date(student.lastCheckOut.seconds * 1000).toLocaleTimeString() : 'N/A',
        student.lastSunscreen ? new Date(student.lastSunscreen.seconds * 1000).toLocaleTimeString() : 'N/A'
      ]);
    });

    const pageTitle = `${pageName.toUpperCase().replace("-", " ")} Attendance Report`;
    doc.text(pageTitle, 10, 10);
    doc.autoTable({
      head: [['Name', 'Status', 'Last Check In', 'Last Check Out', 'Last Sunscreen']],
      body: studentData,
      startY: 20
    });
    
    isFirstPage = false;
  }

  doc.save(`all-attendance-report.pdf`);
  alert('All attendance reports saved as one PDF!');
}

// Reset all data function
async function resetAllData(classroom) {
  if (confirm(`Are you sure you want to reset all data for ${classroom}? This cannot be undone.`)) {
    const studentsRef = collection(db, classroom);
    const studentsSnapshot = await getDocs(studentsRef);
    
    // Create a batch of updates to reset all students at once
    studentsSnapshot.forEach((studentDoc) => {
      updateDoc(studentDoc.ref, {
        checkedIn: false,
        lastCheckIn: null,
        lastCheckOut: null,
        lastSunscreen: null,
      });
    });
    alert(`All data for ${classroom} has been reset.`);
  }
}

// Initial page load, now defaults to daycare
showPage("daycare");

// Expose functions to the global scope for HTML
window.showPage = showPage;
window.checkIn = checkIn;
window.checkOut = checkOut;
window.applySunscreen = applySunscreen;
window.saveAllAsPDF = saveAllAsPDF;
window.resetAllData = resetAllData;
