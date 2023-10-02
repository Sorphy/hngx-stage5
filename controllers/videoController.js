const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const { Deepgram } = require("@deepgram/sdk");

const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
const recordData = {};

const startRecording = (req, res) => {
  try {
    const sessionID = generateUniqueId();
    recordData[sessionID] = { data: [], transcript: [], timeout: null };
    res.status(200).json({ sessionID });
  } catch (error) {
    res.status(500).json({ error: "Recording initialization failed." });
  }
};

const streamRecordingData = (req, res) => {
  try {
    const { sessionID } = req.params;

    if (!recordData[sessionID]) {
      return res.status(404).json({ error: "Session not found." });
    }

    const decodedVideoDataChunk = Buffer.from(
      req.body.videoDataChunk,
      "base64"
    );
    recordData[sessionID].data.push(decodedVideoDataChunk);

    if (recordData[sessionID].timeout) {
      clearTimeout(recordData[sessionID].timeout);
    }

      recordData[sessionID].timeout = setTimeout(async () => {
          const videoData = Buffer.concat(recordData[sessionID].data);
          const transcript = await videoTranscription(videoData);
          recordData[sessionID].transcript = transcript;
        deleteFile(sessionID);
    }, 5 * 60 * 1000);

    res
      .status(200)
      .json({ message: "Video data chunk is successfully received." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to transmit video data." });
  }
};

const stopRecordingAndSave = (req, res) => {
  try {
    const { sessionID } = req.params;

    if (!recordData[sessionID]) {
      return res.status(404).json({ error: "Session not found." });
    }

    const videoData = Buffer.concat(recordData[sessionID].data);
    const uniqueFilename = `${sessionID}-video.mp4`;

    const directoryPath = path.join(__dirname, "../uploads");

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const videoURL = path.join(directoryPath, uniqueFilename);

    fs.writeFileSync(videoURL, videoData);

    clearTimeout(recordData[sessionID].timeout);
    delete recordData[sessionID];

    const streamURL = `/stream/${sessionID}`;

    setTimeout(() => {
      deleteFile(videoURL);
    }, 5 * 60 * 1000);

    res
      .status(200)
      .json({ streamURL, message: "Video saved successfully", videoURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "unable to stop and save recording" });
  }
};

const videoTranscription = async (videoData) => {
    try {
        const transcription = await deepgram.transcription({
            content: videoData,
            encoding: "base64",
        });
        return transcription.text;
    } catch (error) {
        console.error("Error transcribing video:", error);
        return "";
    }
};

const generateUniqueId = () => {
  return uuid.v4();
};

const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting file: ${err}`);
    } else {
      console.log(`Deleted file: ${filePath}`);
    }
  });
};

const streamVideo = (req, res) => {
  try {
    const { sessionID } = req.params;
    const videoURL = path.join(
      __dirname,
      "../uploads",
      `${sessionID}-video.mp4`
    );

    if (!fs.existsSync(videoURL)) {
      return res.status(404).json({ error: "Video not found" });
    }

    const stat = fs.statSync(videoURL);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoURL, { start, end });
      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      const headers = {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      };
      res.writeHead(200, headers);
      fs.createReadStream(videoURL).pipe(res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to stream video." });
  }
};

module.exports = {
  startRecording,
  streamRecordingData,
  stopRecordingAndSave,
  streamVideo,
};