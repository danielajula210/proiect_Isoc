const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS animals (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      species VARCHAR(50) NOT NULL,
      breed VARCHAR(100),
      age INT,
      description TEXT,
      status VARCHAR(30) DEFAULT 'AVAILABLE'
    );
  `);

  console.log("Animal Service database initialized.");
}

initDb().catch((error) => {
  console.error("Database initialization error:", error.message);
});

app.get("/", (req, res) => {
  res.send("Animal Service is running.");
});

app.get("/animals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM animals ORDER BY id ASC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({
      message: "Error getting animals",
      error: error.message,
    });
  }
});

app.get("/animals/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM animals WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Animal not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error getting animal",
      error: error.message,
    });
  }
});

app.post("/animals", async (req, res) => {
  try {
    const { name, species, breed, age, description } = req.body;

    if (!name || !species) {
      return res.status(400).json({
        message: "Name and species are required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO animals (name, species, breed, age, description, status)
       VALUES ($1, $2, $3, $4, $5, 'AVAILABLE')
       RETURNING *`,
      [name, species, breed, age, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error creating animal",
      error: error.message,
    });
  }
});

app.patch("/animals/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required.",
      });
    }

    const result = await pool.query(
      "UPDATE animals SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Animal not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Error updating animal status",
      error: error.message,
    });
  }
});

app.delete("/animals/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM animals WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Animal not found" });
    }

    res.json({ message: "Animal deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting animal",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Animal Service running on port ${PORT}`);
});