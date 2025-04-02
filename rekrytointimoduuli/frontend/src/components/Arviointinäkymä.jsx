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
  const [enlargedImage, setEnlargedImage] = useState(null); // State for enlarged profile picture

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
          const isImage = blob.endsWith(".jpg") || blob.endsWith(".png");
          const blobName = blob.split("-")[0];

          if (isJson) {
            const metadataResponse = await fetch(
              `http://localhost:5000/files/${blob}`
            );
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              details.push({
                ...metadata,
                resumeUrl: null,
                profilePictureUrl: null,
              });
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
          } else if (isImage) {
            const matchingDetail = details.find(
              (detail) => detail.name === blobName
            );
            if (matchingDetail) {
              matchingDetail.profilePictureUrl = `http://localhost:5000/files/${blob}`;
            } else {
              details.push({
                name: blobName,
                profilePictureUrl: `http://localhost:5000/files/${blob}`,
              });
            }
          }
        }

        // Sort details by timestamp (ascending order)
        details.sort((a, b) => {
          const aTimestamp = parseInt(a.name.split("-").pop(), 10);
          const bTimestamp = parseInt(b.name.split("-").pop(), 10);
          return aTimestamp - bTimestamp;
        });

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
      <h2 className="text-center text-primary mb-4">Review Section</h2>
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
                  {detail.profilePictureUrl && (
                    <img
                      src={detail.profilePictureUrl}
                      alt="Profile"
                      className="rounded-circle"
                      style={{
                        width: expandedDetails[index] ? "70px" : "50px", // Enlarge when expanded
                        height: expandedDetails[index] ? "70px" : "50px", // Enlarge when expanded
                        objectFit: "cover",
                        transition: "width 0.3s, height 0.3s", // Smooth transition
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering card toggle
                        setEnlargedImage(detail.profilePictureUrl);
                      }}
                    />
                  )}
                  <span>
                    {expandedDetails[index] ? "▼" : "▶︎"}{" "}
                    {/* Expand/Collapse indicator */}
                  </span>
                </div>
                {expandedDetails[index] && ( // Show details only if expanded
                  <div className="card-body">
                    {detail.email && (
                      <p className="mb-2">
                        <strong>Email:</strong>{" "}
                        <span className="text-primary">{detail.email}</span>
                      </p>
                    )}
                    {detail.phone && (
                      <p className="mb-2">
                        <strong>Phone:</strong>{" "}
                        <span className="text-primary">{detail.phone}</span>
                      </p>
                    )}
                    {detail.github && (
                      <p className="mb-2">
                        <strong>GitHub:</strong>{" "}
                        <a
                          href={detail.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {detail.github}
                        </a>
                      </p>
                    )}
                    {detail.linkedin && (
                      <p className="mb-2">
                        <strong>LinkedIn:</strong>{" "}
                        <a
                          href={detail.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {detail.linkedin}
                        </a>
                      </p>
                    )}
                    {detail.skillRatings && detail.skillRatings.length > 0 && (
                      <div className="mb-3">
                        <h6 className="text-primary">Skill Ratings</h6>
                        <div className="row">
                          {detail.skillRatings.map((rating, index) => (
                            <div key={index} className="col-md-6 mb-3">
                              <div className="card border-0 shadow-sm">
                                <div className="card-body">
                                  <h6 className="card-title text-primary">
                                    {rating.skill}
                                  </h6>
                                  <p className="mb-1">
                                    <strong>Self-Rating:</strong>{" "}
                                    <span className="badge bg-primary">
                                      {rating.rating}
                                    </span>
                                  </p>
                                  <p className="mb-0 text-muted">
                                    <strong>Summary:</strong> {rating.summary}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {detail.additionalInfo && (
                      <p className="mb-2">
                        <strong>Why do you want to join?:</strong>{" "}
                        {detail.additionalInfo}
                      </p>
                    )}
                    {detail.availability && (
                      <p className="mb-2">
                        <strong>Availability:</strong> {detail.availability}
                      </p>
                    )}
                    {detail.resumeUrl && (
                      <button
                        className="btn btn-outline-primary w-100 mt-3"
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

      {enlargedImage && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Profile Picture</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEnlargedImage(null)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={enlargedImage}
                  alt="Enlarged Profile"
                  className="img-fluid rounded"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEnlargedImage(null)}
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
