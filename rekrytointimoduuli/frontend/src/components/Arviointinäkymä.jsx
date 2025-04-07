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
          const parts = blob.split("-");
          const isProfile = parts.includes("profile"); // Check if it's a profile picture
          const blobName = isProfile
            ? parts.slice(0, -2).join("-") // Exclude "-profile" and timestamp
            : parts.slice(0, -1).join("-"); // Exclude only timestamp
          const timestamp = parts[parts.length - 1].split(".")[0]; // Extract timestamp

          let matchingDetail = details.find(
            (detail) =>
              detail.name === blobName && detail.timestamp === timestamp
          );

          if (!matchingDetail) {
            matchingDetail = {
              name: blobName,
              timestamp,
              resumeUrl: null,
              profilePictureUrl: null,
            };
            details.push(matchingDetail);
          }

          if (isJson) {
            const metadataResponse = await fetch(
              `http://localhost:5000/files/${blob}`
            );
            if (metadataResponse.ok) {
              const metadata = await metadataResponse.json();
              Object.assign(matchingDetail, metadata);
            }
          } else if (isPdf) {
            matchingDetail.resumeUrl = `http://localhost:5000/files/${blob}`;
          } else if (isImage && isProfile) {
            matchingDetail.profilePictureUrl = `http://localhost:5000/files/${blob}`;
          }
        }

        // Sort details by timestamp (ascending order)
        details.sort(
          (a, b) => parseInt(a.timestamp, 10) - parseInt(b.timestamp, 10)
        );

        setFetchedDetails(details);
      } else {
        setFetchedDetails([]);
      }
    } catch (error) {
      console.error("Error fetching details from API:", error);
      alert("Failed to fetch details. Check console for more information.");
    }
  };

  const sendRejectionEmail = async (email, name) => {
    try {
      const response = await fetch(
        "http://localhost:5000/send-rejection-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, name }),
        }
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      alert(`Rejection email sent to ${email}.`);
    } catch (error) {
      console.error("Error sending rejection email:", error);
      alert(
        "Failed to send rejection email. Check console for more information."
      );
    }
  };

  const deleteApplicant = async (applicantName, timestamp) => {
    if (!window.confirm("Are you sure you want to decline this applicant?")) {
      return;
    }
    try {
      const applicantNameWithTimestamp = `${applicantName}-${timestamp}`;
      const response = await fetch(
        `http://localhost:5000/delete-applicant/${applicantNameWithTimestamp}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const deletedApplicant = fetchedDetails.find(
        (detail) =>
          detail.name === applicantName && detail.timestamp === timestamp
      );
      setFetchedDetails((prevDetails) =>
        prevDetails.filter(
          (detail) =>
            detail.name !== applicantName || detail.timestamp !== timestamp
        )
      );
      alert("Applicant successfully declined.");
      if (deletedApplicant?.email) {
        await sendRejectionEmail(deletedApplicant.email, deletedApplicant.name);
      }
    } catch (error) {
      console.error("Error deleting applicant:", error);
      alert("Failed to decline applicant. Check console for more information.");
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const isValidUrl = (url) => {
    return url && url.trim() && !url.trim().toLowerCase().includes("empty");
  };

  const formatName = (name) => name.replace(/-/g, " ");

  return (
    <div className="container bg-light p-5 rounded shadow-lg arviointi-container">
      <h2 className="text-center text-primary mb-4">Review Section</h2>
      {fetchedDetails.length > 0 ? (
        <div className="row">
          {fetchedDetails.map((detail, index) => (
            <div key={index} className="col-md-12 mb-4">
              <div className="card shadow-sm arviointi-card">
                <div
                  className="card-header d-flex justify-content-between align-items-center arviointi-card-header"
                  onClick={() => toggleDetail(index)}
                >
                  <h5 className="card-title mb-0 text-primary me-3">
                    {formatName(detail.name)}
                  </h5>
                  {"  "}
                  {detail.profilePictureUrl && (
                    <img
                      src={detail.profilePictureUrl}
                      alt="Profile"
                      className={`rounded-circle arviointi-profile-picture ${
                        expandedDetails[index] ? "expanded" : ""
                      } me-2`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEnlargedImage(detail.profilePictureUrl);
                      }}
                    />
                  )}
                  <span>{expandedDetails[index] ? "▼" : "▶︎"}</span>
                </div>
                {expandedDetails[index] && (
                  <div className="card-body">
                    <div className="d-flex flex-wrap">
                      <div className="flex-grow-1 me-3">
                        {/* Left section */}
                        <div className="row">
                          {detail.email && (
                            <div className="col-md-6 mb-2">
                              <strong>Email:</strong>
                              <div className="text-primary">{detail.email}</div>
                            </div>
                          )}
                          {detail.phone && (
                            <div className="col-md-6 mb-2">
                              <strong>Phone:</strong>
                              <div className="text-primary">{detail.phone}</div>
                            </div>
                          )}
                          {isValidUrl(detail.github) && (
                            <div className="col-md-6 mb-2">
                              <a
                                href={detail.github.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary"
                              >
                                GitHub Profile
                              </a>
                            </div>
                          )}
                          {isValidUrl(detail.linkedin) && (
                            <div className="col-md-6 mb-2">
                              <a
                                href={detail.linkedin.trim()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary"
                              >
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        {/* Right section */}
                        {detail.skillRatings &&
                          detail.skillRatings.length > 0 && (
                            <div className="mb-3">
                              <h6 className="text-primary">Skill Ratings</h6>
                              <div className="list-group">
                                {detail.skillRatings.map((rating, index) => (
                                  <div
                                    key={index}
                                    className="list-group-item arviointi-skill-card"
                                  >
                                    <h6 className="text-primary">
                                      {rating.skill}
                                    </h6>
                                    <p className="mb-1">
                                      <strong>Self-Rating:</strong>{" "}
                                      <span className="badge arviointi-skill-badge">
                                        {rating.rating}
                                      </span>
                                    </p>
                                    <p className="mb-0 text-muted">
                                      <strong>Summary:</strong> {rating.summary}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
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
                    <button
                      className="btn btn-danger w-100 mt-3"
                      onClick={() =>
                        deleteApplicant(detail.name, detail.timestamp)
                      }
                    >
                      Decline Applicant
                    </button>
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
