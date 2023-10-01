const express = require("express");
const router = express.Router();
const {
  startRecording,
  streamRecordingData,
  stopRecordingAndSave,
  streamVideo,
} = require("../controllers/videoController");

// Start recording
router.post("/start-recording", startRecording);

// Stream recording data
router.post("/stream-recording/:sessionID", streamRecordingData);

// Stop recording and save the file
router.post("/stop-recording/:sessionID", stopRecordingAndSave);

//  stream video
router.get("/stream/:sessionID", streamVideo);

module.exports = router;
