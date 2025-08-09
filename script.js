// Import the Firebase libraries as modules from a CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getFirestore, collection, onSnapshot, updateDoc, doc, serverTimestamp, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';

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
  // Check if studentSchedule is an array. If not, or if it's empty, assume they are scheduled every day.
  if (!Array.isArray(studentSchedule) || studentSchedule.length === 0) {
    return true;
  }
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[new Date().getDay()];
  return studentSchedule.includes(today);
}

// Function to render a specific page
function showPage(pageName) {
  contentContainer.innerHTML = "";

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
    case "pastattendance":
      renderPastAttendancePage();
      break;
    default:
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
    studentListDiv.innerHTML = "";

    let totalStudents = 0;
    let presentStudents = 0;
    let absentStudents = 0;
    
    snapshot.forEach((doc) => {
      const student = doc.data();
      const studentId = doc.id;
      
      const isScheduled = isScheduledToday(student.schedule);
      const attendanceStatus = student.checkedIn ? 'Present' : (isScheduled ? 'Absent' : 'Not Scheduled');
      const statusClass = student.checkedIn ? 'checked-in' : (isScheduled ? 'checked-out' : 'not-scheduled');
      
      if(isScheduled){
        totalStudents++;
        if(student.checkedIn) {
          presentStudents++;
        } else {
          absentStudents++;
        }
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
    document.getElementById("absent-count").textContent = absentStudents;
  });
}

// New function to render the Past Attendance page
function renderPastAttendancePage() {
  contentContainer.innerHTML = `
    <h2>Past Attendance Records</h2>
    <div id="past-attendance-list"></div>
  `;

  // Listen for changes in the attendanceHistory collection
  onSnapshot(collection(db, "attendanceHistory"), (snapshot) => {
    const listDiv = document.getElementById("past-attendance-list");
    listDiv.innerHTML = "";

    snapshot.forEach((doc) => {
      const report = doc.data();
      const reportDate = new Date(report.timestamp.seconds * 1000).toLocaleDateString();

      const reportCard = document.createElement("div");
      reportCard.className = "report-card";
      
      const header = document.createElement("div");
      header.className = "report-header";
      header.innerHTML = `<h3>Attendance Report for ${reportDate}</h3>`;
      
      const content = document.createElement("div");
      content.className = "report-content";
      content.style.display = 'none'; // Start hidden

      content.innerHTML = `
        <h4>Daycare</h4>
        <ul>
          ${report.daycare.map(student => `<li>${student.name}: ${student.status}</li>`).join('')}
        </ul>
        <h4>Classroom 1</h4>
        <ul>
          ${report.classroom1.map(student => `<li>${student.name}: ${student.status}</li>`).join('')}
        </ul>
        <h4>Classroom 2</h4>
        <ul>
          ${report.classroom2.map(student => `<li>${student.name}: ${student.status}</li>`).join('')}
        </ul>
        <h4>Classroom 3</h4>
        <ul>
          ${report.classroom3.map(student => `<li>${student.name}: ${student.status}</li>`).join('')}
        </ul>
      `;

      header.onclick = () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      };

      reportCard.appendChild(header);
      reportCard.appendChild(content);
      listDiv.appendChild(reportCard);
    });
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

// New function to save PDF and to Firebase
async function saveAllAsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pages = ['daycare', 'classroom1', 'classroom2', 'classroom3'];
  let isFirstPage = true;
  const attendanceDataToSave = {};

  for (const pageName of pages) {
    if (!isFirstPage) {
      doc.addPage();
    }
    
    const studentsRef = collection(db, pageName);
    const studentsSnapshot = await getDocs(studentsRef);
    const studentData = [];
    const attendanceRecords = [];

    studentsSnapshot.forEach((doc) => {
      const student = doc.data();
      const isScheduled = isScheduledToday(student.schedule);
      const status = student.checkedIn ? 'Present' : (isScheduled ? 'Absent' : 'Not Scheduled');
      
      studentData.push([
        student.name,
        status,
        student.lastCheckIn ? new Date(student.lastCheckIn.seconds * 1000).toLocaleTimeString() : 'N/A',
        student.lastCheckOut ? new Date(student.lastCheckOut.seconds * 1000).toLocaleTimeString() : 'N/A',
        student.lastSunscreen ? new Date(student.lastSunscreen.seconds * 1000).toLocaleTimeString() : 'N/A'
      ]);

      // Add to attendance records for Firebase
      attendanceRecords.push({
        name: student.name,
        status: status
      });
    });

    attendanceDataToSave[pageName] = attendanceRecords;
    
    const pageTitle = `${pageName.toUpperCase().replace("-", " ")} Attendance Report`;
    doc.text(pageTitle, 10, 10);
    doc.autoTable({
      head: [['Name', 'Status', 'Last Check In', 'Last Check Out', 'Last Sunscreen']],
      body: studentData,
      startY: 20
    });
    
    isFirstPage = false;
  }
  
  // Save the attendance data to the new Firestore collection
  await addDoc(collection(db, "attendanceHistory"), {
    ...attendanceDataToSave,
    timestamp: serverTimestamp()
  });

  doc.save(`all-attendance-report.pdf`);
  alert('All attendance reports saved as one PDF and to attendance history!');
}

// Reset all data function
async function resetAllData(classroom) {
  if (confirm(`Are you sure you want to reset all data for ${classroom}? This cannot be undone.`)) {
    const studentsRef = collection(db, classroom);
    const studentsSnapshot = await getDocs(studentsRef);
    
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

// This makes the functions available to the HTML's onclick attributes
window.showPage = showPage;
window.checkIn = checkIn;
window.checkOut = checkOut;
window.applySunscreen = applySunscreen;
window.saveAllAsPDF = saveAllAsPDF;
window.resetAllData = resetAllData;

// Initial page load, now defaults to daycare
showPage("daycare");
