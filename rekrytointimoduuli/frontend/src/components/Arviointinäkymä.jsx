import React, { useState, useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core"; // Use project-centered path for react-pdf-viewer
import "@react-pdf-viewer/core/lib/styles/index.css"; // Use project-centered path for styles
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const Arviointinäkymä = () => {
  const [fetchedDetails, setFetchedDetails] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null); // State to track the selected PDF

  const fetchDetails = async () => {
    try {
      console.log("Fetching details from localhost API...");

      const response = await fetch("http://localhost:5000/fetch-details");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.blobs)) {
        const details = [];
        for (const blob of data.blobs) {
          const isJson = blob.endsWith(".json");
          const isPdf = blob.endsWith(".pdf");
          const blobName = blob.split("-")[0];

          if (isJson) {
            const metadataResponse = await fetch(
              `http://localhost:5000/files/${blob}`
            );
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              details.push({ ...metadata, resumeUrl: null });
            }
          } else if (isPdf) {
            const matchingDetail = details.find(
              (detail) => detail.name === blobName
            );
            if (matchingDetail) {
              matchingDetail.resumeUrl = `http://localhost:5000/files/${blob}`;
            } else {
              // Handle case where PDF exists without metadata
              details.push({
                name: blobName,
                resumeUrl: `http://localhost:5000/files/${blob}`,
              });
            }
          }
        }
        setFetchedDetails(details);
      } else {
        console.error(
          "API response does not contain a valid blobs array:",
          data
        );
        setFetchedDetails([]);
      }
    } catch (error) {
      console.error("Error fetching details from API:", error);
      alert("Failed to fetch details. Check console for more information.");
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  return (
    <div>
      <h2>Arviointinäkymä</h2>
      {fetchedDetails.length > 0 ? (
        fetchedDetails.map((detail, index) => (
          <div key={index}>
            <h3>{detail.name}</h3>
            {detail.email && <p>Email: {detail.email}</p>}
            {detail.phone && <p>Phone: {detail.phone}</p>}
            {detail.skills && <p>Skills: {detail.skills.join(", ")}</p>}
            {detail.portfolio && <p>Portfolio: {detail.portfolio}</p>}
            {detail.additionalInfo && (
              <p>Additional Info: {detail.additionalInfo}</p>
            )}
            {detail.availability && <p>Availability: {detail.availability}</p>}
            {detail.resumeUrl && (
              <p>
                Resume:{" "}
                <button onClick={() => setSelectedPdf(detail.resumeUrl)}>
                  View Resume
                </button>
              </p>
            )}
          </div>
        ))
      ) : (
        <p>No details available.</p>
      )}

      {/* Render the selected PDF using react-pdf */}
      {selectedPdf && (
        <div
          style={{
            border: "1px solid #ccc",
            marginTop: "20px",
            width: "40vw",
            height: "100vh",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h3>Resume Preview</h3>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer fileUrl={selectedPdf} />
          </Worker>
          <button onClick={() => setSelectedPdf(null)}>Close Preview</button>
        </div>
      )}
    </div>
  );
};

export default Arviointinäkymä;
