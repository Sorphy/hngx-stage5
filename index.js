const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const videoRoute = require("./routes/videoRoute");
app.use("/api", videoRoute);

app.get("/", (req, res) => {
  res.send("Server is running.");
});

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
