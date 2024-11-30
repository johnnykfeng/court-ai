import React, { useState } from "react";
import './App.css'; // Assuming the CSS is placed in App.css
import axios from "axios";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';


function App() {
  const [file, setFile] = useState(null);
  const [activeTab, setActiveTab] = useState('client-info');
  const [message, setMessage] = useState();

  const showTab = (tabId) => {
    setActiveTab(tabId);
  };
  const [files, setFiles] = useState({
    contract: null,
    proformaInvoice: null,
    paymentReceipt: null,
    shippingDocuments: null
  });

  const [fileContents, setFileContents] = useState({
    contractContent: '',
    proformaInvoiceContent: '',
    paymentReceiptContent: '',
    shippingDocumentsContent: ''
  });

  // Handle file changes for each file input
  const handleFileChange = (event, fileType) => {
    const selectedFile = event.target.files[0];
    setFiles((prev) => ({ ...prev, [fileType]: selectedFile }));

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

  // Handle submit
const handleSubmit = async (event) => {
  event.preventDefault();
  if (!files.contract || !files.proformaInvoice || !files.paymentReceipt || !files.shippingDocuments) {
    setMessage("Please upload all required files.");
    return;
  }

  // Prepare the form data for upload
  const formData = new FormData();
  formData.append("contract", files.contract);
  formData.append("proformaInvoice", files.proformaInvoice);
  formData.append("paymentReceipt", files.paymentReceipt);
  formData.append("shippingDocuments", files.shippingDocuments);

  // Prepare the text contents to send in the API call
  const extractedTexts = {
    contractContent: fileContents.contractContent,
    proformaInvoiceContent: fileContents.proformaInvoiceContent,
    paymentReceiptContent: fileContents.paymentReceiptContent,
    shippingDocumentsContent: fileContents.shippingDocumentsContent
  };

  try {
    // Send the API call with the extracted texts as parameters
    const response = await axios.post('http://127.0.0.1:5000/upload', {
      contractContent: extractedTexts.contractContent,
      proformaInvoiceContent: extractedTexts.proformaInvoiceContent,
      paymentReceiptContent: extractedTexts.paymentReceiptContent,
      shippingDocumentsContent: extractedTexts.shippingDocumentsContent
    });

    // Handle the response
    if (response.status === 200) {
      setMessage("Files uploaded and data processed successfully.");
    } else {
      setMessage("Failed to process files.");
    }
  } catch (error) {
    setMessage("Error uploading files: " + error.message);
  }
};


    // Prepare the form data for upload
    const formData = new FormData();
    formData.append("contract", files.contract);
    formData.append("proformaInvoice", files.proformaInvoice);
    formData.append("paymentReceipt", files.paymentReceipt);
    formData.append("shippingDocuments", files.shippingDocuments);
  
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

        <h2>Upload Supporting Documents</h2>
           <form onSubmit={handleSubmit}>
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
               {fileContents.contractContent && (
                 <div className="file-preview">
                   <h3>Extracted Content:</h3>
                   <textarea rows="8" value={fileContents.contractContent} readOnly />
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
               {fileContents.proformaInvoiceContent && (
                 <div className="file-preview">
                   <h3>Extracted Content:</h3>
                   <textarea rows="8" value={fileContents.proformaInvoiceContent} readOnly />
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
               {fileContents.paymentReceiptContent && (
                 <div className="file-preview">
                   <h3>Extracted Content:</h3>
                   <textarea rows="8" value={fileContents.paymentReceiptContent} readOnly />
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
               {fileContents.shippingDocumentsContent && (
                 <div className="file-preview">
                   <h3>Extracted Content:</h3>
                   <textarea rows="8" value={fileContents.shippingDocumentsContent} readOnly />
                 </div>
               )}
             </div>
     
             {/* Submit Button */}
             <div className="form-group">
               <button type="submit">Submit Case</button>
             </div>
     
             {/* Displaying message */}
             {message && <p>{message}</p>}
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
