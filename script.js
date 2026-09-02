// Import the Firebase libraries as modules from a CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getFirestore, collection, onSnapshot, updateDoc, doc, serverTimestamp, getDocs, addDoc, getDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDZYW4AQXyCtkB2mUMN-QIsc577ZwjvlsE",
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
  if (!studentSchedule) {
    return true; // Default to true if no schedule object exists
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[new Date().getDay()];

  // If schedule is a key-value object e.g. { Monday: "Both", Friday: "AM" }
  if (typeof studentSchedule === 'object' && !Array.isArray(studentSchedule)) {
    return studentSchedule.hasOwnProperty(today) && Boolean(studentSchedule[today]);
  }
  
  // If schedule is an array e.g. ["Monday", "Wednesday"]
  if (Array.isArray(studentSchedule)) {
    const lowerCaseSchedule = studentSchedule
      .filter(day => typeof day === 'string')
      .map(day => day.trim().toLowerCase());
    return lowerCaseSchedule.includes(today.toLowerCase());
  }
  
  return false;
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
    case "busses":
      renderBusPage("busstudents");
      break;
    case "fullday":
      renderFullDayPage();
      break;
    case "pastattendance":
      renderPastAttendancePage();
      break;
    default:
      renderClassroomPage("daycare");
      break;
  }
}

// Function to render a classroom page
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
        <button class="reset-button" onclick="resetAllData()">Reset All Data</button>
      </div>
    </div>
    <div id="student-header">
      <h2>${classroom.toUpperCase().replace("-", " ")}</h2>
      <input type="text" id="search-bar" placeholder="Search students..." />
    </div>
    <div id="student-list"></div>
  `;

  // Fetch student data from Firebase, sorted by name
  onSnapshot(query(collection(db, classroom), orderBy("name")), (snapshot) => {
    const allStudents = [];
    snapshot.forEach((doc) => {
      allStudents.push({ student: doc.data(), studentId: doc.id });
    });
    
    // Initial display of all students
    displayStudents(allStudents, classroom);

    // Add search functionality
    const searchBar = document.getElementById("search-bar");
    if (searchBar) {
      searchBar.addEventListener("input", (e) => {
        displayStudents(allStudents, classroom, e.target.value);
      });
    }
  });
}

// Function to filter and display students and update counts for regular classrooms
function displayStudents(students, classroom, searchTerm = '') {
  const studentListDiv = document.getElementById("student-list");
  if (!studentListDiv) return;
  studentListDiv.innerHTML = "";

  const filteredStudents = students.filter(studentObj =>
    studentObj.student && studentObj.student.name && typeof studentObj.student.name === 'string' && studentObj.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let totalCount = 0;
  let presentCount = 0;
  let absentCount = 0;

  filteredStudents.forEach(({ student, studentId }) => {
    totalCount++; 
    
    let attendanceStatus;
    let statusClass;

    if (student.checkedIn) {
      presentCount++;
      attendanceStatus = 'Present';
      statusClass = 'checked-in';
    } else {
      absentCount++;
      if (student.lastCheckOut) {
        attendanceStatus = 'Checked Out';
        statusClass = 'checked-out';
      } else {
        const isScheduled = isScheduledToday(student.schedule);
        attendanceStatus = isScheduled ? 'Absent' : 'Not Scheduled';
        statusClass = isScheduled ? 'absent' : 'not-scheduled';
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

  const totalElem = document.getElementById("total-count");
  const presentElem = document.getElementById("present-count");
  const absentElem = document.getElementById("absent-count");
  if (totalElem) totalElem.textContent = totalCount;
  if (presentElem) presentElem.textContent = presentCount;
  if (absentElem) absentElem.textContent = absentCount;
}

// Function to render the bus page
function renderBusPage(classroom) {
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
        <button class="reset-button" onclick="resetAllData()">Reset All Data</button>
      </div>
    </div>
    <div id="student-header">
      <h2>BUS ATTENDANCE</h2>
      <input type="text" id="search-bar" placeholder="Search students..." />
    </div>
    <div id="student-list"></div>
  `;

  onSnapshot(query(collection(db, classroom), orderBy("name")), (snapshot) => {
    const allStudents = [];
    snapshot.forEach((doc) => {
      allStudents.push({ student: doc.data(), studentId: doc.id });
    });
    
    displayBusStudents(allStudents, classroom);

    const searchBar = document.getElementById("search-bar");
    if (searchBar) {
      searchBar.addEventListener("input", (e) => {
        displayBusStudents(allStudents, classroom, e.target.value);
      });
    }
  });
}

// Function to display students for the bus page with conditional buttons and timestamps
function displayBusStudents(students, classroom, searchTerm = '') {
  const studentListDiv = document.getElementById("student-list");
  if (!studentListDiv) return;
  studentListDiv.innerHTML = "";

  const filteredStudents = students.filter(studentObj =>
    studentObj.student && studentObj.student.name && typeof studentObj.student.name === 'string' && studentObj.student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let totalCount = 0;
  let presentCount = 0;
  let absentCount = 0;

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[new Date().getDay()];

  filteredStudents.forEach(({ student, studentId }) => {
    totalCount++; 
    if (student.checkedIn) {
      presentCount++;
    } else {
      absentCount++;
    }

    const isScheduled = isScheduledToday(student.schedule);
    const attendanceStatus = student.checkedIn ? 'Present' : (isScheduled ? 'Absent' : 'Not Scheduled');
    const statusClass = student.checkedIn ? 'checked-in' : (isScheduled ? 'checked-out' : 'not-scheduled');
    
    const todaysSchedule = student.schedule ? student.schedule[today] : null;
    let scheduleTag = '';
    if (todaysSchedule) {
      scheduleTag = `<span class="schedule-tag">${todaysSchedule}</span>`;
    }
    
    let timestampsHtml = '';
    let buttonsHtml = '';

    if (todaysSchedule === 'AM' || todaysSchedule === 'Both') {
        const lastAMIn = student.lastAMIn
          ? new Date(student.lastAMIn.seconds * 1000).toLocaleTimeString()
          : "N/A";
        const lastAMOut = student.lastAMOut
          ? new Date(student.lastAMOut.seconds * 1000).toLocaleTimeString()
          : "N/A";
        timestampsHtml += `<p>AM In: ${lastAMIn}</p><p>AM Out: ${lastAMOut}</p>`;
        buttonsHtml += `<button class="bus-button am-in-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'amIn')">AM In</button>
                        <button class="bus-button am-out-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'amOut')">AM Out</button>`;
    }
    
    if (todaysSchedule === 'PM' || todaysSchedule === 'Both') {
        const lastPMIn = student.lastPMIn
          ? new Date(student.lastPMIn.seconds * 1000).toLocaleTimeString()
          : "N/A";
        const lastPMOut = student.lastPMOut
          ? new Date(student.lastPMOut.seconds * 1000).toLocaleTimeString()
          : "N/A";
        timestampsHtml += `<p>PM In: ${lastPMIn}</p><p>PM Out: ${lastPMOut}</p>`;
        buttonsHtml += `<button class="bus-button pm-in-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'pmIn')">PM In</button>
                        <button class="bus-button pm-out-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'pmOut')">PM Out</button>`;
    }

    // If no schedule is set for today, show all timestamps and buttons
    if (!todaysSchedule && isScheduled) {
      const lastAMIn = student.lastAMIn
        ? new Date(student.lastAMIn.seconds * 1000).toLocaleTimeString()
        : "N/A";
      const lastAMOut = student.lastAMOut
        ? new Date(student.lastAMOut.seconds * 1000).toLocaleTimeString()
        : "N/A";
      const lastPMIn = student.lastPMIn
        ? new Date(student.lastPMIn.seconds * 1000).toLocaleTimeString()
        : "N/A";
      const lastPMOut = student.lastPMOut
        ? new Date(student.lastPMOut.seconds * 1000).toLocaleTimeString()
        : "N/A";
      timestampsHtml += `<p>AM In: ${lastAMIn}</p><p>AM Out: ${lastAMOut}</p><p>PM In: ${lastPMIn}</p><p>PM Out: ${lastPMOut}</p>`;
      buttonsHtml += `<button class="bus-button am-in-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'amIn')">AM In</button>
                      <button class="bus-button am-out-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'amOut')">AM Out</button>
                      <button class="bus-button pm-in-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'pmIn')">PM In</button>
                      <button class="bus-button pm-out-button" onclick="updateBusStudentStatus('${classroom}', '${studentId}', 'pmOut')">PM Out</button>`;
    }

    const studentCard = document.createElement("div");
    studentCard.className = "student-card";

    studentCard.innerHTML = `
      <div class="student-info">
        <h4>${student.name} <span class="status-badge ${statusClass}">${attendanceStatus}</span> ${scheduleTag}</h4>
        ${timestampsHtml}
      </div>
      <div class="action-buttons">
        ${buttonsHtml}
      </div>
    `;
    studentListDiv.appendChild(studentCard);
  });

  const totalElem = document.getElementById("total-count");
  const presentElem = document.getElementById("present-count");
  const absentElem = document.getElementById("absent-count");
  if (totalElem) totalElem.textContent = totalCount;
  if (presentElem) presentElem.textContent = presentCount;
  if (absentElem) absentElem.textContent = absentCount;
}

// Function to render the Full Day page
async function renderFullDayPage() {
  const today = new Date();
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString('en-US', dateOptions);

  contentContainer.innerHTML = `
      <div id="info-header">
          <div id="date-display">${formattedDate}</div>
      </div>
      <div id="student-header">
          <h2>FULL DAY STUDENTS</h2>
          <input type="text" id="search-bar" placeholder="Search students..." />
      </div>
      <div id="student-list"></div>
  `;

  const studentListDiv = document.getElementById("student-list");
  const searchBar = document.getElementById("search-bar");

  const allStudentsData = await fetchFullDayStudents();
  displayFullDayStudents(allStudentsData, studentListDiv);

  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredStudents = allStudentsData.filter(student => 
            student.name && student.name.toLowerCase().includes(searchTerm)
        );
        displayFullDayStudents(filteredStudents, studentListDiv);
    });
  }
}

// Function to fetch Full Day students from classrooms
async function fetchFullDayStudents() {
    const fullDayCollections = ['classroom1', 'classroom2', 'classroom3'];
    const studentsBySharedId = new Map();

    for (const collectionName of fullDayCollections) {
        const snapshot = await getDocs(collection(db, collectionName));
        snapshot.forEach(docSnap => {
            const student = docSnap.data();
            const sharedId = student.sharedId || docSnap.id;
            
            if (!studentsBySharedId.has(sharedId)) {
                studentsBySharedId.set(sharedId, {
                    ...student,
                    id: docSnap.id,
                    classroom: collectionName
                });
            } else {
                const existingStudent = studentsBySharedId.get(sharedId);
                studentsBySharedId.set(sharedId, { ...existingStudent, ...student });
            }
        });
    }

    const allStudents = Array.from(studentsBySharedId.values());
    allStudents.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return allStudents;
}

function displayFullDayStudents(students, container) {
  if (!container) return;
  container.innerHTML = "";
  students.forEach(student => {
      let attendanceStatus;
      let statusClass;

      if (student.checkedIn) {
          attendanceStatus = 'Present';
          statusClass = 'checked-in';
      } else {
          if (student.lastCheckOut) {
              attendanceStatus = 'Checked Out';
              statusClass = 'checked-out';
          } else {
              const isScheduled = isScheduledToday(student.schedule);
              attendanceStatus = isScheduled ? 'Absent' : 'Not Scheduled';
              statusClass = isScheduled ? 'absent' : 'not-scheduled';
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
              <p>Classroom: ${student.classroom ? student.classroom.toUpperCase().replace("-", " ") : 'N/A'}</p>
              <p>Last Check In: ${lastCheckInTimestamp}</p>
              <p>Last Check Out: ${lastCheckOutTimestamp}</p>
              <p>Last Sunscreen: ${lastSunscreenTimestamp}</p>
          </div>
          <div class="action-buttons">
              <button class="check-in-button" onclick="checkIn('${student.classroom}', '${student.id}')">Check In</button>
              <button class="check-out-button" onclick="checkOut('${student.classroom}', '${student.id}')">Check Out</button>
          </div>
      `;
      container.appendChild(studentCard);
  });
}

// Function to update bus student status
async function updateBusStudentStatus(classroom, studentId, eventType) {
    const studentDocRef = doc(db, classroom, studentId);
    const studentDocSnap = await getDoc(studentDocRef);
  
    if (studentDocSnap.exists()) {
      const updateData = {};
      
      switch (eventType) {
        case 'amIn':
          updateData.checkedIn = true;
          updateData.lastAMIn = serverTimestamp();
          break;
        case 'amOut':
          updateData.checkedIn = false;
          updateData.lastAMOut = serverTimestamp();
          break;
        case 'pmIn':
          updateData.checkedIn = true;
          updateData.lastPMIn = serverTimestamp();
          break;
        case 'pmOut':
          updateData.checkedIn = false;
          updateData.lastPMOut = serverTimestamp();
          break;
        default:
          console.error("Invalid event type:", eventType);
          return;
      }
      
      await updateDoc(studentDocRef, updateData);
    }
}

// Function to display and filter past attendance
function displayPastAttendance(allReports, searchTerm = '') {
  const listDiv = document.getElementById("past-attendance-list");
  if (!listDiv) return;
  listDiv.innerHTML = "";

  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  allReports.forEach((doc) => {
    const report = doc.data();
    const reportDate = report.timestamp 
      ? new Date(report.timestamp.seconds * 1000).toLocaleDateString()
      : "Unknown Date";

    const reportCard = document.createElement("div");
    reportCard.className = "report-card";
    
    const header = document.createElement("div");
    header.className = "report-header";
    header.innerHTML = `<h3>Attendance Report for ${reportDate}</h3>`;
    
    const content = document.createElement("div");
    content.className = "report-content";
    content.style.display = 'none';

    let contentHtml = '';
    const classrooms = ['daycare', 'classroom1', 'classroom2', 'classroom3', 'busstudents'];
    let shouldDisplay = false;

    classrooms.forEach(classroom => {
      const classroomReport = report[classroom];

      if (classroomReport) {
        const filteredStudents = classroomReport.filter(student => 
          student.name && student.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
        if (filteredStudents.length > 0) {
          shouldDisplay = true;
          contentHtml += `<h4>${classroom.toUpperCase().replace("-", " ")}</h4>`;
          contentHtml += `<table class="report-table">`;
          
          if (classroom === 'busstudents') {
            contentHtml += `<thead><tr><th>Name</th><th>Status</th><th>AM In</th><th>AM Out</th><th>PM In</th><th>PM Out</th></tr></thead>`;
          } else {
            contentHtml += `<thead><tr><th>Name</th><th>Status</th><th>Last Check In</th><th>Last Check Out</th><th>Last Sunscreen</th></tr></thead>`;
          }
          
          contentHtml += `<tbody>`;
          
          filteredStudents.forEach(student => {
            contentHtml += `<tr><td>${student.name}</td><td>${student.status}</td>`;
            if (classroom === 'busstudents') {
              contentHtml += `<td>${student.lastAMIn || 'N/A'}</td>`;
              contentHtml += `<td>${student.lastAMOut || 'N/A'}</td>`;
              contentHtml += `<td>${student.lastPMIn || 'N/A'}</td>`;
              contentHtml += `<td>${student.lastPMOut || 'N/A'}</td>`;
            } else {
              contentHtml += `<td>${student.lastCheckIn || 'N/A'}</td>`;
              contentHtml += `<td>${student.lastCheckOut || 'N/A'}</td>`;
              contentHtml += `<td>${student.lastSunscreen || 'N/A'}</td>`;
            }
            contentHtml += `</tr>`;
          });
          
          contentHtml += `</tbody></table>`;
        }
      }
    });

    content.innerHTML = contentHtml;

    if (shouldDisplay) {
      header.onclick = () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      };

      reportCard.appendChild(header);
      reportCard.appendChild(content);
      listDiv.appendChild(reportCard);
    }
  });
}

// Function to render the Past Attendance page
function renderPastAttendancePage() {
  contentContainer.innerHTML = `
    <h2>Past Attendance Records</h2>
    <input type="text" id="past-attendance-search-bar" placeholder="Search by name..." />
    <div id="past-attendance-list"></div>
  `;

  onSnapshot(collection(db, "attendanceHistory"), (snapshot) => {
    const allReports = [];
    snapshot.forEach((doc) => {
      allReports.push(doc);
    });

    allReports.sort((a, b) => {
      const dateA = a.data().timestamp?.seconds || 0;
      const dateB = b.data().timestamp?.seconds || 0;
      return dateB - dateA; 
    });

    displayPastAttendance(allReports);

    const searchBar = document.getElementById("past-attendance-search-bar");
    if (searchBar) {
      searchBar.addEventListener("input", (e) => {
        displayPastAttendance(allReports, e.target.value);
      });
    }
  });
}

// Centralized function to update a student's status across all collections
async function updateStudentStatusBySharedId(sharedId, updateData) {
    if (!sharedId) {
        console.error("Shared ID is required to update student status across collections.");
        return;
    }

    const collectionsToSearch = ['daycare', 'classroom1', 'classroom2', 'classroom3', 'busstudents'];
    
    for (const collectionName of collectionsToSearch) {
        const q = query(collection(db, collectionName), where('sharedId', '==', sharedId));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((docSnap) => {
            if (docSnap.exists()) {
                updateDoc(doc(db, collectionName, docSnap.id), updateData);
            }
        });
    }
}

async function checkIn(classroom, studentId) {
    const studentDocRef = doc(db, classroom, studentId);
    const studentDocSnap = await getDoc(studentDocRef);

    if (studentDocSnap.exists() && studentDocSnap.data().sharedId) {
        await updateStudentStatusBySharedId(studentDocSnap.data().sharedId, {
            checkedIn: true,
            lastCheckIn: serverTimestamp(),
        });
    } else {
        await updateDoc(studentDocRef, {
            checkedIn: true,
            lastCheckIn: serverTimestamp(),
        });
    }
}

async function checkOut(classroom, studentId) {
    const studentDocRef = doc(db, classroom, studentId);
    const studentDocSnap = await getDoc(studentDocRef);

    if (studentDocSnap.exists() && studentDocSnap.data().sharedId) {
        await updateStudentStatusBySharedId(studentDocSnap.data().sharedId, {
            checkedIn: false,
            lastCheckOut: serverTimestamp(),
        });
    } else {
        await updateDoc(studentDocRef, {
            checkedIn: false,
            lastCheckOut: serverTimestamp(),
        });
    }
}

async function applySunscreen(classroom, studentId) {
    const studentDocRef = doc(db, classroom, studentId);
    const studentDocSnap = await getDoc(studentDocRef);

    if (studentDocSnap.exists() && studentDocSnap.data().sharedId) {
        await updateStudentStatusBySharedId(studentDocSnap.data().sharedId, {
            lastSunscreen: serverTimestamp(),
        });
    } else {
        await updateDoc(studentDocRef, {
            lastSunscreen: serverTimestamp(),
        });
    }
}

async function saveAllAsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pages = ['daycare', 'classroom1', 'classroom2', 'classroom3', 'busstudents'];
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
      let status;
      if (student.checkedIn) {
          status = 'Present';
      } else if (student.lastCheckOut) {
          status = 'Checked Out';
      } else {
          status = isScheduledToday(student.schedule) ? 'Absent' : 'Not Scheduled';
      }
      
      if (pageName === 'busstudents') {
          studentData.push([
              student.name || 'Unknown',
              status,
              student.lastAMIn ? new Date(student.lastAMIn.seconds * 1000).toLocaleTimeString() : 'N/A',
              student.lastAMOut ? new Date(student.lastAMOut.seconds * 1000).toLocaleTimeString() : 'N/A',
              student.lastPMIn ? new Date(student.lastPMIn.seconds * 1000).toLocaleTimeString() : 'N/A',
              student.lastPMOut ? new Date(student.lastPMOut.seconds * 1000).toLocaleTimeString() : 'N/A'
          ]);
      } else {
          studentData.push([
              student.name || 'Unknown',
              status,
              student.lastCheckIn ? new Date(student.lastCheckIn.seconds * 1000).toLocaleTimeString() : 'N/A',
              student.lastCheckOut ? new Date(student.lastCheckOut.seconds * 1000).toLocaleTimeString() : 'N/A',
              student.lastSunscreen ? new Date(student.lastSunscreen.seconds * 1000).toLocaleTimeString() : 'N/A'
          ]);
      }
      
      attendanceRecords.push({
        name: student.name || 'Unknown',
        status: status,
        lastCheckIn: student.lastCheckIn ? new Date(student.lastCheckIn.seconds * 1000).toLocaleTimeString() : null,
        lastCheckOut: student.lastCheckOut ? new Date(student.lastCheckOut.seconds * 1000).toLocaleTimeString() : null,
        lastSunscreen: student.lastSunscreen ? new Date(student.lastSunscreen.seconds * 1000).toLocaleTimeString() : null,
        lastAMIn: student.lastAMIn ? new Date(student.lastAMIn.seconds * 1000).toLocaleTimeString() : null,
        lastAMOut: student.lastAMOut ? new Date(student.lastAMOut.seconds * 1000).toLocaleTimeString() : null,
        lastPMIn: student.lastPMIn ? new Date(student.lastPMIn.seconds * 1000).toLocaleTimeString() : null,
        lastPMOut: student.lastPMOut ? new Date(student.lastPMOut.seconds * 1000).toLocaleTimeString() : null,
      });
    });

    attendanceDataToSave[pageName] = attendanceRecords;
    
    const pageTitle = `${pageName.toUpperCase().replace("-", " ")} Attendance Report`;
    doc.text(pageTitle, 10, 10);
    
    if (pageName === 'busstudents') {
        doc.autoTable({
            head: [['Name', 'Status', 'AM In', 'AM Out', 'PM In', 'PM Out']],
            body: studentData,
            startY: 20
        });
    } else {
        doc.autoTable({
            head: [['Name', 'Status', 'Last Check In', 'Last Check Out', 'Last Sunscreen']],
            body: studentData,
            startY: 20
        });
    }
    
    isFirstPage = false;
  }
  
  await addDoc(collection(db, "attendanceHistory"), {
    ...attendanceDataToSave,
    timestamp: serverTimestamp()
  });

  doc.save(`all-attendance-report.pdf`);
  alert('All attendance reports saved as one PDF and to attendance history!');
}

// Reset all data function
async function resetAllData() {
  if (confirm(`Are you sure you want to reset all attendance data for all classrooms? This cannot be undone.`)) {
    const collectionsToReset = ['daycare', 'classroom1', 'classroom2', 'classroom3', 'busstudents'];
    
    for (const collectionName of collectionsToReset) {
      const studentsRef = collection(db, collectionName);
      const studentsSnapshot = await getDocs(studentsRef);
      
      const updatePromises = studentsSnapshot.docs.map(docSnap => {
        return updateDoc(doc(db, collectionName, docSnap.id), {
          checkedIn: false,
          lastCheckIn: null,
          lastCheckOut: null,
          lastSunscreen: null,
          lastAMIn: null,
          lastAMOut: null,
          lastPMIn: null,
          lastPMOut: null,
        });
      });
      await Promise.all(updatePromises);
    }
    alert(`All attendance data has been reset for all classrooms.`);
  }
}

// Global exports
window.showPage = showPage;
window.checkIn = checkIn;
window.checkOut = checkOut;
window.applySunscreen = applySunscreen;
window.saveAllAsPDF = saveAllAsPDF;
window.resetAllData = resetAllData;
window.updateBusStudentStatus = updateBusStudentStatus;

showPage("daycare");
