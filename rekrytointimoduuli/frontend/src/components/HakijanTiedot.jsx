import React, { useState } from "react";
import { BlobServiceClient } from "@azure/storage-blob";

const HakijanTiedot = () => {
  const [details, setDetails] = useState({ name: "", email: "" });

  // Handle input change and update the state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  // Save details to Azure Blob Storage
  const saveToBlob = async () => {
    // Initialize the BlobServiceClient with your Azure Storage connection string
    const blobServiceClient = new BlobServiceClient(
      "YOUR_AZURE_STORAGE_CONNECTION_STRING"
    );

    // Get the container client for the 'personal-details' container
    const containerClient =
      blobServiceClient.getContainerClient("personal-details");

    // Generate a unique blob name using the applicant's name and the current timestamp
    const blobName = `${details.name}-${Date.now()}.json`;

    // Get the block blob client for the specific blob
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Convert the applicant's details to a JSON string
    const data = JSON.stringify(details);

    // Upload the JSON string to the blob
    await blockBlobClient.upload(data, data.length);

    // Alert the user that the details have been saved
    alert("Details saved to Azure Blob Storage");
  };

  // Export details from Azure Blob Storage
  const exportFromBlob = async () => {
    const blobServiceClient = new BlobServiceClient(
      "YOUR_AZURE_STORAGE_CONNECTION_STRING"
    );
    const containerClient =
      blobServiceClient.getContainerClient("personal-details");
    const blobName = "example-blob.json"; // Replace with the actual blob name
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const downloaded = await downloadBlockBlobResponse.blobBody;
    const text = await downloaded.text();
    const exportedDetails = JSON.parse(text);
    console.log("Exported Details:", exportedDetails);
  };

  return (
    <div>
      <h2>Hakijan Tiedot</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={details.name}
        onChange={handleChange}
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={details.email}
        onChange={handleChange}
      />
      <button onClick={saveToBlob}>Save to Blob</button>
      <button onClick={exportFromBlob}>Export from Blob</button>
    </div>
  );
};

export default HakijanTiedot;
