import React, { useState } from "react";
import './App.css'; // Assuming the CSS is placed in App.css
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('client-info');

  const showTab = (tabId) => {
    setActiveTab(tabId);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Failed to upload file. " + error.response?.data?.error || error.message);
    }
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Court AI</h2>
        <ul>
          <li
            onClick={() => showTab('client-info')}
            className={activeTab === 'client-info' ? 'active' : ''}
          >
            Client Information
          </li>
          <li
            onClick={() => showTab('case-summary')}
            className={activeTab === 'case-summary' ? 'active' : ''}
          >
            Case Summary
          </li>
          <li
            onClick={() => showTab('case-report')}
            className={activeTab === 'case-report' ? 'active' : ''}
          >
            Case Report
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="content">
        {/* Client Information Content */}
        {activeTab === 'client-info' && (
          <div className="content-panel">
            <h2><b>Client Information</b></h2>
            <form>
              <div className="form-group">
                <label htmlFor="legalName">Full Legal Name and Registration:</label>
                <input type="text" id="legalName" name="legalName" placeholder="Enter your company's full legal name" />
              </div>

              <div className="form-group">
                <label htmlFor="registrationDetails">Registration Details:</label>
                <textarea id="registrationDetails" name="registrationDetails" rows="3" placeholder="Provide the registration details (e.g., company registration number)"></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="keyContacts">Primary Contacts:</label>
                <textarea id="keyContacts" name="keyContacts" rows="4" placeholder="List key personnel involved in this transaction (names, titles, contact information)"></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="legalCounsel">Legal Representation:</label>
                <textarea id="legalCounsel" name="legalCounsel" rows="3" placeholder="Have you engaged legal counsel? Provide their contact information."></textarea>
              </div>

              <div className="form-group">
                <button type="submit">Save Client Information</button>
              </div>
            </form>
          </div>
        )}

        {/* Case Summary Content */}
        {activeTab === 'case-summary' && (
          <div className="content-panel">
            <h2><b>Case Summary</b></h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="caseDetails">Case Details:</label>
                <textarea id="caseDetails" name="caseDetails" rows="8" placeholder="Please explain your case in detail..."></textarea>
              </div>

              <h2>Upload Supporting Documents:</h2>

              <div className="form-group">
                <label htmlFor="upload1">1 - Contract:</label>
                <label className="custom-file-upload">
                  <input type="file" id="upload1" name="contract" onChange={handleFileChange} />
                  Click to upload Contract
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="upload2">2 - Proforma Invoice:</label>
                <label className="custom-file-upload">
                  <input type="file" id="upload2" name="proformaInvoice" />
                  Click to upload Proforma Invoice
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="upload3">3 - Payment Receipt:</label>
                <label className="custom-file-upload">
                  <input type="file" id="upload3" name="paymentReceipt" />
                  Click to upload Payment Receipt
                </label>
              </div>

              <div className="form-group">
                <label htmlFor="upload4">4 - Shipping Documents:</label>
                <label className="custom-file-upload">
                  <input type="file" id="upload4" name="shippingDocuments" />
                  Click to upload Shipping Documents
                </label>
              </div>

              <div className="form-group">
                <button type="submit">Submit Case</button>
              </div>
            </form>
          </div>
        )}

        {/* Case Report Content */}
        {activeTab === 'case-report' && (
          <div className="content-panel">
            <h2><b>Case Report</b></h2>
            <div style={{ border: '2px solid #d4af37', borderRadius: '15px', padding: '20px', backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '18px', color: '#001f3f', lineHeight: '1.6' }}>
                This is the Case Report section. You can provide detailed summaries, analyses, or outcomes of the case here.
                Ensure all important aspects are covered concisely and clearly.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
