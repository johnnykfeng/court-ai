// export default App;
import React, { useState } from "react";
import axios from "axios";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import './App.css'; // Assuming the CSS is placed in App.css
import Alert from '@mui/material/Alert';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CircularProgress from '@mui/material/CircularProgress';



function App() {
  const [activeTab, setActiveTab] = useState('client-info');
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [submittedText, setSubmittedText] = useState(""); // State to store submitted text
  const [caseDetails, setCaseDetails] = useState(''); // State to hold the textarea value
  const [files, setFiles] = useState({
    contract: null,
    proformaInvoice: null,
    paymentReceipt: null,
    shippingDocuments: null
  });

// Set the workerSrc to the correct version of the worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

  const [fileContents, setFileContents] = useState({
    contractContent: '',
    proformaInvoiceContent: '',
    paymentReceiptContent: '',
    shippingDocumentsContent: ''
  });
  const [filenames, setFilenames] = useState({
    contract: '',
    proformaInvoice: '',
    paymentReceipt: '',
    shippingDocuments: ''
  });

  const showTab = (tabId) => {
    setActiveTab(tabId);
  };


  const handleFileChange = (event, fileType) => {
    const selectedFile = event.target.files[0];
    setFiles((prev) => ({ ...prev, [fileType]: selectedFile }));
    setFilenames((prev) => ({ ...prev, [fileType]: selectedFile.name }));

    const reader = new FileReader();

    if (selectedFile.type === "text/plain") {
      // Handle text files
      reader.onload = () => {
        setFileContents((prev) => ({ ...prev, [`${fileType}Content`]: reader.result }));
      };
      reader.readAsText(selectedFile); // Read the file as text
    } else if (selectedFile.type === "application/pdf") {
      // Handle PDF files
      reader.onload = () => {
        const pdfData = new Uint8Array(reader.result);
        pdfjsLib.getDocument(pdfData).promise.then((pdf) => {
          let text = '';
          const numPages = pdf.numPages;
          const extractTextFromPage = (pageNum) => {
            pdf.getPage(pageNum).then((page) => {
              page.getTextContent().then((textContent) => {
                text += textContent.items.map(item => item.str).join(' ') + '\n';
                if (pageNum < numPages) {
                  extractTextFromPage(pageNum + 1);
                } else {
                  setFileContents((prev) => ({ ...prev, [`${fileType}Content`]: text }));
                }
              });
            });
          };
          extractTextFromPage(1);
        });
      };
      reader.readAsArrayBuffer(selectedFile); // Read PDF as binary
    } else if (selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Handle Word files (.docx)
      reader.onload = () => {
        const arrayBuffer = reader.result;
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
          .then((result) => {
            setFileContents((prev) => ({ ...prev, [`${fileType}Content`]: result.value }));
          })
          .catch((err) => {
            setMessage("Failed to extract text from Word file.");
          });
      };
      reader.readAsArrayBuffer(selectedFile); // Read Word file as binary
    } else {
      setMessage("Unsupported file type.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!files.contract || !files.proformaInvoice || !files.paymentReceipt || !files.shippingDocuments) {
      setMessage("Please upload all required files.");
       return;
    }

     setLoading(!loading);

     // Prepare the form data for upload
    const formData = new FormData();
    formData.append("contract", files.contract);
    formData.append("proformaInvoice", files.proformaInvoice);
    formData.append("paymentReceipt", files.paymentReceipt);
    formData.append("shippingDocuments", files.shippingDocuments);
    formData.append("caseDetails", caseDetails)

    // Prepare the text contents to send in the API call
    const extractedTexts = {
      contractContent: fileContents.contractContent,
      proformaInvoiceContent: fileContents.proformaInvoiceContent,
      paymentReceiptContent: fileContents.paymentReceiptContent,
      shippingDocumentsContent: fileContents.shippingDocumentsContent,
      caseDetails: caseDetails
    };

    try {
      // Send the API call with the extracted texts as parameters
      const response = await axios.post('http://127.0.0.1:5000/upload', {
        contractContent: extractedTexts.contractContent,
        proformaInvoiceContent: extractedTexts.proformaInvoiceContent,
        paymentReceiptContent: extractedTexts.paymentReceiptContent,
        shippingDocumentsContent: extractedTexts.shippingDocumentsContent,
        caseDetails: caseDetails

      });

      if (response.status === 200) {
        setMessage("Files uploaded and data processed successfully.");
        setActiveTab('case-report');
        console.log("The output:", response.data.caseReport)
        setSubmittedText(response.data.caseReport);
        setLoading(false);
       } else {
        setMessage("Failed to process files.");
       }
    } catch (error) {
      setMessage("Error uploading files: " + error.message);
    }
  };

  const handleCase = (event) => {
    setActiveTab('case-summary');
    
  }

  const handleText = (event) => {
    setCaseDetails(event.target.value); // Update state with the textarea value
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
            <form onSubmit={handleCase}>
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

              <div  className="form-group">
                <button     
               type="submit">Save Client Information</button>
              </div>
            </form>
          </div>
        )}

        {/* Case Summary Content */}
        {activeTab === 'case-summary' && (
          <div className="content-panel" id="case-summary">
            <h2><b>Case Summary</b></h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="caseDetails">Case Details:</label>
                <textarea id="caseDetails" name="caseDetails" rows="8" 
                        value={caseDetails} // Bind state to textarea value
                        onChange={handleText} // Update state on text change                
                placeholder="Please explain your case in detail..."></textarea>
                <h2 style={{marginTop: 30}}>Upload Supporting Documents</h2>
                {/* Contract File */}
                <div className="form-group">
                  <label htmlFor="upload1">1 - Contract:</label>
                  <label className="custom-file-upload">
                    <input
                      type="file"
                      id="upload1"
                      name="contract"
                      onChange={(e) => handleFileChange(e, 'contract')}
                    />
                    Click to upload Contract
                  </label>
                  {filenames.contract && (
                    <div className="file-uploaded">
                      <p>Uploaded: {filenames.contract}</p>
                    </div>
                  )}
                </div>

                {/* Proforma Invoice File */}
                <div className="form-group">
                  <label htmlFor="upload2">2 - Proforma Invoice:</label>
                  <label className="custom-file-upload">
                    <input
                      type="file"
                      id="upload2"
                      name="proformaInvoice"
                      onChange={(e) => handleFileChange(e, 'proformaInvoice')}
                    />
                    Click to upload Proforma Invoice
                  </label>
                  {filenames.proformaInvoice && (
                    <div className="file-uploaded">
                      <p>Uploaded: {filenames.proformaInvoice}</p>
                    </div>
                  )}
                </div>

                {/* Payment Receipt File */}
                <div className="form-group">
                  <label htmlFor="upload3">3 - Payment Receipt:</label>
                  <label className="custom-file-upload">
                    <input
                      type="file"
                      id="upload3"
                      name="paymentReceipt"
                      onChange={(e) => handleFileChange(e, 'paymentReceipt')}
                    />
                    Click to upload Payment Receipt
                  </label>
                  {filenames.paymentReceipt && (
                    <div className="file-uploaded">
                      <p>Uploaded: {filenames.paymentReceipt}</p>
                    </div>
                  )}
                </div>

                {/* Shipping Documents File */}
                <div className="form-group">
                  <label htmlFor="upload4">4 - Shipping Documents:</label>
                  <label className="custom-file-upload">
                    <input
                      type="file"
                      id="upload4"
                      name="shippingDocuments"
                      onChange={(e) => handleFileChange(e, 'shippingDocuments')}
                    />
                    Click to upload Shipping Documents
                  </label>
                  {filenames.shippingDocuments && (
                    <div className="file-uploaded">
                      <p>Uploaded: {filenames.shippingDocuments}</p>
                    </div>
                  )}
                </div>

                <div className="form-group">
                <button
  type="submit"
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px", // Space between spinner and text
    padding: "23px 50px",
    fontSize: "16px",
    position: "relative",
  }}
>
  {loading && <CircularProgress color="secondary" size={20} />}
  <span>Submit</span>
</button>
                {/* <button type="submit">
                {loading && <CircularProgress color="secondary" />}
                  Submit</button> */}
                </div>
              </div>
              {message &&<Alert
          severity="info"
          sx={{
            width: '100%', // Adjust width inside the container
            height: '10vh', // Height using viewport units
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        
        >
          {message}
        </Alert>}
            </form>
           
            
          </div>
        )}

        {/* Case Report Content */}
        {activeTab === 'case-report' && (
      //       <div className="content-panel">
      //       <h2><b>Case Report</b></h2>
      //       <div style={{ border: '2px solid #d4af37', borderRadius: '15px', padding: '20px', backgroundColor: '#ffffff', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
      //         <p style={{ fontSize: '18px', color: '#001f3f', lineHeight: '1.6' }}>
      //           This is the Case Report section. You can provide detailed summaries, analyses, or outcomes of the case here.
      //           Ensure all important aspects are covered concisely and clearly.
      //         </p>

      //         <div
      //   style={{
      //     marginTop: "20px",
      //     border: "2px solid #d4af37",
      //     borderRadius: "15px",
      //     padding: "20px",
      //     backgroundColor: "#ffffff",
      //     boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      //   }}
      // >
      //   {submittedText ? (
      //     <p style={{ fontSize: "18px", color: "#001f3f", lineHeight: "1.6" }}>
      //       {submittedText}
      //     </p>
      //   ) : (
      //     <p style={{ fontSize: "18px", color: "#888888", lineHeight: "1.6" }}>
      //       no result 
      //     </p>
      //   )}
      // </div>

      //       </div>
      //     </div>
      <div className="content-panel">
      <h2>
        <b>Case Report</b>
      </h2>
      <div
        style={{
          border: "2px solid #d4af37",
          borderRadius: "15px",
          padding: "20px",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <p
          style={{
            fontSize: "18px",
            color: "#001f3f",
            lineHeight: "1.6",
          }}
        >
          This is the Case Report section. You can provide detailed summaries,
          analyses, or outcomes of the case here. Ensure all important aspects
          are covered concisely and clearly.
        </p>

        <div
          style={{
            marginTop: "20px",
            border: "2px solid #d4af37",
            borderRadius: "15px",
            padding: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          {submittedText ? (
            <ReactMarkdown
              children={submittedText}
              remarkPlugins={[remarkGfm]}
              style={{ fontSize: "18px", color: "#001f3f", lineHeight: "1.6" }}
            />
          ) : (
            <p
              style={{
                fontSize: "18px",
                color: "#888888",
                lineHeight: "1.6",
              }}
            >
              No result
            </p>
          )}
        </div>
      </div>
    </div>
        )}
      </div>
 
    </div>
  );
}

export default App;
