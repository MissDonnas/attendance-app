const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
admin.initializeApp();

exports.dailyAttendanceSave = functions.pubsub.schedule('0 23 * * 1-5').onRun(async (context) => {
  const db = admin.firestore();
  const collectionsToSave = ['daycare', 'classroom1', 'classroom2', 'classroom3'];
  const attendanceDataToSave = {};

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = daysOfWeek[new Date().getDay()];

  // A simplified isScheduledToday function for the server
  const isScheduledToday = (studentSchedule) => {
    if (!Array.isArray(studentSchedule) || studentSchedule.length === 0) {
      return true;
    }
    const lowerCaseSchedule = studentSchedule.map(day => day.trim().toLowerCase());
    return lowerCaseSchedule.includes(today.toLowerCase());
  };

  for (const collectionName of collectionsToSave) {
    const studentsRef = db.collection(collectionName);
    const studentsSnapshot = await studentsRef.get();
    const attendanceRecords = [];

    studentsSnapshot.forEach((doc) => {
      const student = doc.data();
      const isScheduled = isScheduledToday(student.schedule);
      const status = student.checkedIn ? 'Present' : (isScheduled ? 'Absent' : 'Not Scheduled');
      
      attendanceRecords.push({
        name: student.name,
        status: status,
      });
    });

    attendanceDataToSave[collectionName] = attendanceRecords;
  }

  // Save the attendance data to the new Firestore collection
  await db.collection("attendanceHistory").add({
    ...attendanceDataToSave,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Daily attendance report saved successfully.");
  return null;
});
