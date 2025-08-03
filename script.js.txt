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
// Render a classroom page
function renderClassroomPage(classroom) {
  contentContainer.innerHTML = `
    <h2>${classroom.toUpperCase().replace("-", " ")}</h2>
    <input type="text" id="search-bar" placeholder="Search students..." />
    <div id="student-list"></div>
  `;

  // Fetch student data from Firebase
  db.collection(classroom).onSnapshot((snapshot) => {
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
  db.collection(classroom).doc(studentId).update({
    checkedIn: true,
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function checkOut(classroom, studentId) {
  db.collection(classroom).doc(studentId).update({
    checkedIn: false,
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

function applySunscreen(classroom, studentId) {
  // We can add more logic here, like a timestamp for when sunscreen was applied
  alert(`Sunscreen applied for ${studentId} in ${classroom}`);
}

// Initial page load
showPage("home");

// You'll need to add a way to populate the initial data in Firebase.
// For example, you can have an admin page or manually add students
// to your Firestore collections (e.g., 'classroom1', 'classroom2', 'classroom3')
// with a 'name' and 'checkedIn' field.

// Also, implement the search functionality here
document.addEventListener("input", (e) => {
  if (e.target.id === "search-bar") {
    // Logic to filter the student list based on the search query
    // This will involve iterating through the student list and hiding/showing
    // based on the search input.
  }
});