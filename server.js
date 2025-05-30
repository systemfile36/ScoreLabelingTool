const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Create Express app
const app = express();

//Use static middleware and parse only json ('Content-Type': 'application/json')
app.use(express.json());
app.use(express.static("public"));

app.post("/load-db", (req, res) => {
  const { dbPath, dbTableName, page, limit } = req.body;
  const db = new sqlite3.Database(dbPath);
  //for paging
  const offset = page * limit;

  db.all(`SELECT * FROM ${dbTableName} ORDER BY total_bookmarks DESC LIMIT ${limit} OFFSET ${offset}`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get(`SELECT COUNT(*) as count FROM ${dbTableName}`, (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ rows, total: countRow.count });
      db.close();
    })
  });
});

app.get("/get-image", (req, res) => {
  const filePath = req.query.path;
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).send("Image not found");
  }
});

app.post("/update-row", (req, res) => {
  const { dbPath, row, dbTableName } = req.body;
  const db = new sqlite3.Database(dbPath);

  const keys = Object.keys(row);
  const values = keys.map(k => row[k]);

  const placeholders = keys.map(() => '?').join(", ");
  const sql = `INSERT OR REPLACE INTO ${dbTableName} (${keys.join(", ")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.close();
    res.json({ success: true });
  });
});

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});