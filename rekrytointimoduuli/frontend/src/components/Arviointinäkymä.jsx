import React, { useState, useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Arviointinäkymä.css"; // Add custom styles if needed

const Arviointinäkymä = () => {
  const [fetchedDetails, setFetchedDetails] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState({}); // Track expanded state for each detail

  const toggleDetail = (index) => {
    setExpandedDetails((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const fetchDetails = async () => {
    try {
      const response = await fetch("http://localhost:5000/fetch-details");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
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
              details.push({
                name: blobName,
                resumeUrl: `http://localhost:5000/files/${blob}`,
              });
            }
          }
        }
        setFetchedDetails(details);
      } else {
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
    <div className="container bg-light p-5 rounded shadow-lg">
      <h2 className="text-center text-primary mb-4">Arviointinäkymä</h2>
      {fetchedDetails.length > 0 ? (
        <div className="row">
          {fetchedDetails.map((detail, index) => (
            <div key={index} className="col-md-12 mb-4">
              <div className="card shadow-sm">
                <div
                  className="card-header d-flex justify-content-between align-items-center"
                  onClick={() => toggleDetail(index)}
                  style={{ cursor: "pointer" }}
                >
                  <h5 className="card-title mb-0">{detail.name}</h5>
                  <span>
                    {expandedDetails[index] ? "▼" : "▶︎"}{" "}
                    {/* Expand/Collapse indicator */}
                  </span>
                </div>
                {expandedDetails[index] && ( // Show details only if expanded
                  <div className="card-body">
                    {detail.email && (
                      <p className="card-text">Email: {detail.email}</p>
                    )}
                    {detail.phone && (
                      <p className="card-text">Phone: {detail.phone}</p>
                    )}
                    {detail.skills && (
                      <p className="card-text">
                        Skills: {detail.skills.join(", ")}
                      </p>
                    )}
                    {detail.skillRatings && detail.skillRatings.length > 0 && (
                      <div>
                        <h6>Skill Ratings</h6>
                        <ul className="list-group list-group-flush">
                          {detail.skillRatings.map((rating, index) => (
                            <li key={index} className="list-group-item">
                              <strong>Skill:</strong> {rating.skill} <br />
                              <strong>Rating:</strong> {rating.rating} <br />
                              <strong>Summary:</strong> {rating.summary}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {detail.portfolio && (
                      <p className="card-text">Portfolio: {detail.portfolio}</p>
                    )}
                    {detail.additionalInfo && (
                      <p className="card-text">
                        Additional Info: {detail.additionalInfo}
                      </p>
                    )}
                    {detail.availability && (
                      <p className="card-text">
                        Availability: {detail.availability}
                      </p>
                    )}
                    {detail.summary && (
                      <p className="card-text">Summary: {detail.summary}</p>
                    )}
                    {detail.resumeUrl && (
                      <button
                        className="btn btn-primary mt-3"
                        onClick={() => setSelectedPdf(detail.resumeUrl)}
                      >
                        View Resume
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center">No details available.</p>
      )}

      {selectedPdf && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Resume Preview</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedPdf(null)}
                ></button>
              </div>
              <div className="modal-body">
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <Viewer fileUrl={selectedPdf} />
                </Worker>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedPdf(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Arviointinäkymä;
