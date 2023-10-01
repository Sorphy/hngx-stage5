const express = require("express");
const app = express();
const cors = require("cors");
// const { readdirSync } = require("fs");

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// readdirSync("./routes").map((path) => {
//   app.use("/api", require(`./routes/${path}`));
// });
const videoRoute = require("./routes/videoRoute");
app.use("/api", videoRoute);

app.get("/", (req, res) => {
  res.send("Server is running.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
