const express = require("express");
const cors = require("cors");
const multer = require("multer");
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  ContainerSASPermissions,
} = require("@azure/storage-blob");
const path = require("path");
const fs = require("fs");
require("dotenv").config({
  path: "c:/Users/Mikael/projektit/Rekrytointimoduuli/Rekrytointimoduuli-1/.env",
}); // Explicitly load .env file

console.log("Loaded environment variables:"); // Debugging log
console.log(
  "AZURE_STORAGE_ACCOUNT_NAME:",
  process.env.AZURE_STORAGE_ACCOUNT_NAME || "undefined"
);
console.log(
  "AZURE_STORAGE_ACCOUNT_KEY:",
  process.env.AZURE_STORAGE_ACCOUNT_KEY ? "Loaded" : "Missing"
);
console.log(
  "AZURE_STORAGE_CONTAINER_NAME:",
  process.env.AZURE_STORAGE_CONTAINER_NAME || "undefined"
);

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

app.use(cors());
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Azure Blob Storage configuration
const AZURE_STORAGE_CONNECTION_STRING =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Test route to verify server is running
app.get("/test", (req, res) => {
  res.json({ message: "Test route is working!" });
});

// Ensure /upload is registered before the catch-all route
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    console.log("Received fields:", req.body); // Debugging log
    console.log("Received file:", req.file); // Debugging log

    if (!req.file) {
      console.error("Resume file is missing"); // Debugging log
      return res.status(400).json({ error: "Resume file is required" });
    }

    // Parse and validate skillRatings
    let skillRatings;
    try {
      skillRatings = JSON.parse(req.body.skillRatings);
      if (!Array.isArray(skillRatings)) {
        throw new Error("skillRatings is not an array");
      }
      skillRatings.forEach((rating, index) => {
        if (
          typeof rating.skill !== "string" ||
          typeof rating.rating !== "number" ||
          typeof rating.summary !== "string"
        ) {
          throw new Error(
            `Invalid skillRatings structure at index ${index}: ${JSON.stringify(
              rating
            )}`
          );
        }
      });
    } catch (error) {
      console.error("Invalid skillRatings format:", error.message); // Debugging log
      return res.status(400).json({ error: "Invalid skillRatings format" });
    }

    console.log("Validated skillRatings:", skillRatings); // Debugging log

    // Generate unique timestamp for consistent naming
    const timestamp = Date.now();

    // Upload the resume file to Azure Blob Storage
    const resumeBlobName = `${req.body.name}-${timestamp}${path.extname(
      req.file.originalname
    )}`;
    const resumeBlobClient = containerClient.getBlockBlobClient(resumeBlobName);

    console.log("Uploading resume to Azure Blob Storage:", resumeBlobName);
    await resumeBlobClient.uploadFile(req.file.path);
    console.log("Resume uploaded successfully:", resumeBlobName);

    // Prepare metadata
    const metadataBlobName = `${req.body.name}-${timestamp}.json`;
    const metadataBlobClient =
      containerClient.getBlockBlobClient(metadataBlobName);

    const metadata = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      skills: JSON.parse(req.body.skills),
      skillRatings, // Use validated skillRatings
      github: req.body.github || "Empty", // Handle optional GitHub URL
      linkedin: req.body.linkedin || "Empty", // Handle optional LinkedIn URL
      additionalInfo: req.body.additionalInfo || "",
      availability: req.body.availability || "",
    };

    console.log("Uploading metadata to Azure Blob Storage:", metadataBlobName);
    await metadataBlobClient.upload(
      JSON.stringify(metadata),
      Buffer.byteLength(JSON.stringify(metadata))
    );
    console.log("Metadata uploaded successfully:", metadataBlobName);

    // Clean up temporary file
    fs.unlinkSync(req.file.path);
    console.log("Temporary file deleted:", req.file.path);

    res.json({ message: "Details saved to Azure Blob Storage" });
  } catch (error) {
    console.error("Error during upload:", error); // Debugging log
    res.status(500).json({
      error: "Failed to save details to Azure Blob Storage",
      details: error.message,
    });
  }
});

// Endpoint to fetch details from Azure Blob Storage
app.get("/fetch-details", async (req, res) => {
  try {
    console.log("Fetching blobs from Azure Blob Storage...");

    // Validate environment variables
    if (!AZURE_STORAGE_CONNECTION_STRING || !containerName) {
      console.error(
        "Missing Azure Storage connection string or container name"
      );
      return res.status(500).json({
        error: "Azure Storage connection string or container name is missing",
      });
    }

    // Test connection to Azure Blob Storage
    console.log("Testing connection to Azure Blob Storage...");
    const containerExists = await containerClient.exists();
    if (!containerExists) {
      console.error(`Container "${containerName}" does not exist`);
      return res
        .status(404)
        .json({ error: `Container "${containerName}" not found` });
    }
    console.log(`Connection to container "${containerName}" successful`);

    // Fetch blobs
    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push(blob.name);
    }

    console.log("Blobs fetched successfully:", blobs);
    res.json({ blobs });
  } catch (error) {
    console.error(
      "Error fetching details from Azure Blob Storage:",
      error.message
    );
    res.status(500).json({
      error: "Failed to fetch details from Azure Blob Storage",
      details: error.message,
    });
  }
});

app.get("/get-sas-token", (req, res) => {
  try {
    console.log("Returning pre-generated SAS token..."); // Debugging log
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
    const sasToken = process.env.AZURE_STORAGE_SAS_TOKEN;

    // Check if environment variables are loaded
    if (!accountName || !containerName || !sasToken) {
      console.error(
        "Missing Azure Storage account name, container name, or SAS token"
      );
      return res.status(500).json({
        error:
          "Missing Azure Storage account name, container name, or SAS token",
      });
    }

    const containerUrl = `https://${accountName}.blob.core.windows.net/${containerName}`;
    console.log("Constructed containerUrl:", containerUrl); // Debugging log

    res.json({
      sasToken,
      containerUrl,
    });
  } catch (error) {
    console.error("Error returning SAS token:", error); // Detailed error log
    res
      .status(500)
      .json({ error: "Failed to return SAS token", details: error.message });
  }
});

// Endpoint to serve files from Azure Blob Storage
app.get("/files/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`Fetching file: ${filename} from Azure Blob Storage`);

    const blobClient = containerClient.getBlobClient(filename);
    const exists = await blobClient.exists();

    if (!exists) {
      console.error(`File not found: ${filename}`);
      return res.status(404).json({ error: "File not found" });
    }

    const downloadBlockBlobResponse = await blobClient.download();
    const contentType =
      downloadBlockBlobResponse.contentType || "application/octet-stream";

    // Set Content-Disposition to inline for .pdf files
    if (filename.endsWith(".pdf")) {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    res.setHeader("Content-Type", contentType);
    downloadBlockBlobResponse.readableStreamBody.pipe(res);
  } catch (error) {
    console.error(
      "Error fetching file from Azure Blob Storage:",
      error.message
    );
    res.status(500).json({
      error: "Failed to fetch file from Azure Blob Storage",
      details: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend toimii!");
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  console.error(`Endpoint not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
