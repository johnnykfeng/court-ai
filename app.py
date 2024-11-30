from flask import Flask, request, jsonify
import os
from flask_cors import CORS

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import PromptTemplate
from PROMPTS import *

from dotenv import load_dotenv
load_dotenv()   

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
llm = ChatOpenAI(model="gpt-4o-mini",
                 api_key=OPENAI_API_KEY)


def create_search_query(case_details):
    search_template = PromptTemplate(input_variables=["case_details"], template=SEARCH_PROMPT)
    search_prompt = search_template.format(
        case_details = case_details)

    search_query = llm.invoke(search_prompt)
    return search_query

def search_legal_information(search_query):

    # return relevant_content
    return """Section II. Conformity of the goods and third-party claims
Article 35
(1) The seller must deliver goods which are of the quantity, quality
and description required by the contract and which are contained or packaged
in the manner required by the contract.
(2) Except where the parties have agreed otherwise, the goods do not
conform with the contract unless they:
(a) are fit for the purposes for which goods of the same description
would ordinarily be used;"""

def create_case_report(case_details, 
                       relevant_legal_information, 
                       contract_content, 
                       proforma_invoice_content, payment_receipt_content, shipping_documents_content):

    prompt_template = PromptTemplate(input_variables=["case_details", "relevant_legal_information", "contract_content", "proforma_invoice_content", "payment_receipt_content", "shipping_documents_content"], template=METAPROMPT)
    full_prompt = prompt_template.format(
        case_details = case_details,
        relevant_legal_information = relevant_legal_information,
        contract_content = contract_content,
        proforma_invoice_content = proforma_invoice_content,
        payment_receipt_content = payment_receipt_content,
        shipping_documents_content = shipping_documents_content
    )

    case_report = llm.invoke(full_prompt)
    return case_report


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
 
@app.route('/upload', methods=['POST'])
def upload_files(): # this triggered with SUBMIT CASE button
    try:
        # case_details = request.json.get('caseDetails')
        case_details = "blah blah blah about the case"

        # Extract the content from the request body
        contract_content = request.json.get('contractContent')
        proforma_invoice_content = request.json.get('proformaInvoiceContent')
        payment_receipt_content = request.json.get('paymentReceiptContent')
        shipping_documents_content = request.json.get('shippingDocumentsContent')

        # llm processing here
        search_query = create_search_query(case_details)
        relevant_legal_information = search_legal_information(search_query)
        case_report = create_case_report(case_details, 
                                         relevant_legal_information, 
                                         contract_content, 
                                         proforma_invoice_content, 
                                         payment_receipt_content, 
                                         shipping_documents_content)
        

        # Process the data as needed
        # For now, we just return the data received
        return jsonify({
            'contractContent': contract_content,
            'proformaInvoiceContent': proforma_invoice_content,
            'paymentReceiptContent': payment_receipt_content,
            'shippingDocumentsContent': shipping_documents_content
        }), 200
        
        # return jsonify({
        #     'caseReport': case_report
        # }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# @app.route('/save', methods=['POST'])
# def output_case_report():
#     try:
#         # Extract content from request
#         case_report_content = request.json.get('caseReportContent')
#         return jsonify({'message': 'Content saved successfully'}), 200
#     except Exception as e:
#         return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True)
    
