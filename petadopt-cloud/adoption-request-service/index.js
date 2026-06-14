const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/adoption_requests_db";
const ANIMAL_SERVICE_URL =
  process.env.ANIMAL_SERVICE_URL || "http://localhost:3001";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB.");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

const adoptionRequestSchema = new mongoose.Schema(
  {
    animalId: {
      type: Number,
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    applicantEmail: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

const AdoptionRequest = mongoose.model(
  "AdoptionRequest",
  adoptionRequestSchema
);

app.get("/", (req, res) => {
  res.send("Adoption Request Service is running.");
});

app.get("/adoption-requests", async (req, res) => {
  try {
    const requests = await AdoptionRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: "Error getting adoption requests",
      error: error.message,
    });
  }
});

app.get("/adoption-requests/:id", async (req, res) => {
  try {
    const request = await AdoptionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({
      message: "Error getting adoption request",
      error: error.message,
    });
  }
});

app.post("/adoption-requests", async (req, res) => {
  try {
    const { animalId, applicantName, applicantEmail, message } = req.body;

    if (!animalId || !applicantName || !applicantEmail) {
      return res.status(400).json({
        message: "animalId, applicantName and applicantEmail are required.",
      });
    }

    const animalResponse = await axios.get(
      `${ANIMAL_SERVICE_URL}/animals/${animalId}`
    );

    const animal = animalResponse.data;

    if (animal.status !== "AVAILABLE") {
      return res.status(400).json({
        message: "This animal is not available for adoption.",
      });
    }

    const adoptionRequest = new AdoptionRequest({
      animalId,
      applicantName,
      applicantEmail,
      message,
    });

    const savedRequest = await adoptionRequest.save();

    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(500).json({
      message: "Error creating adoption request",
      error: error.message,
    });
  }
});

app.patch("/adoption-requests/:id/approve", async (req, res) => {
  try {
    const request = await AdoptionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    request.status = "APPROVED";
    await request.save();

    await axios.patch(`${ANIMAL_SERVICE_URL}/animals/${request.animalId}/status`, {
      status: "ADOPTED",
    });

    res.json({
      message: "Adoption request approved and animal marked as adopted.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error approving adoption request",
      error: error.message,
    });
  }
});

app.patch("/adoption-requests/:id/reject", async (req, res) => {
  try {
    const request = await AdoptionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    request.status = "REJECTED";
    await request.save();

    res.json({
      message: "Adoption request rejected.",
      request,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting adoption request",
      error: error.message,
    });
  }
});

app.delete("/adoption-requests/:id", async (req, res) => {
  try {
    const request = await AdoptionRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Adoption request not found" });
    }

    res.json({ message: "Adoption request deleted successfully." });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting adoption request",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Adoption Request Service running on port ${PORT}`);
});