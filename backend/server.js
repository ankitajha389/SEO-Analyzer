require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./api/routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`SEO Analyzer API running at http://localhost:${PORT}`));
