from flask import Flask, request, jsonify
import os
from flask_cors import CORS

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.prompts import PromptTemplate
from PROMPTS import *
from pinecone_module import get_similar_content
import os
from dotenv import load_dotenv
load_dotenv()   

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
llm = ChatOpenAI(model="gpt-4o",
                 api_key=OPENAI_API_KEY,
                 temperature=0.1,
                 max_tokens=None)


def create_search_query(case_details):
    search_template = PromptTemplate(input_variables=["case_details"], template=SEARCH_PROMPT)
    search_prompt = search_template.format(
        case_details = case_details)

    search_query = llm.invoke(search_prompt).content
    return search_query

def create_case_report(case_details, 
                       relevant_legal_information, 
                       client_document_1, 
                       client_document_2, 
                       client_document_3,
                       client_document_4):

    prompt_template = PromptTemplate(input_variables=["case_details", 
                                                      "relevant_legal_information", 
                                                      "client_document_1", 
                                                      "client_document_2", 
                                                      "client_document_3",
                                                      "client_document_4"], 
                                     template=METAPROMPT)
    full_prompt = prompt_template.format(
        case_details = case_details,
        relevant_legal_information = relevant_legal_information,
        client_document_1 = client_document_1,
        client_document_2 = client_document_2,
        client_document_3 = client_document_3,
        client_document_4 = client_document_4
    )

    case_report = llm.invoke(full_prompt).content
    return case_report



app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

@app.route('/upload', methods=['POST'])
def upload_files(): # this triggered with SUBMIT CASE button
    try:
        # case_details = request.json.get('caseDetails')
        case_details = "blah blah blah about the case"

        # Extract the content from the request body
        case_details = request.json.get('caseDetails')
        # print(case_details)
        contract_content = request.json.get('contractContent')
        # print(contract_content)
        proforma_invoice_content = request.json.get('proformaInvoiceContent')
        # print(proforma_invoice_content)
        payment_receipt_content = request.json.get('paymentReceiptContent')
        # print(payment_receipt_content)
        shipping_documents_content = request.json.get('shippingDocumentsContent')
        # print(shipping_documents_content)

        # llm processing here
        search_query = create_search_query(case_details)
        relevant_legal_information = get_similar_content(search_query)
        case_report = create_case_report(case_details, 
                                         relevant_legal_information, 
                                         contract_content, 
                                         proforma_invoice_content, 
                                         payment_receipt_content, 
                                         shipping_documents_content)
        print("--- CASE REPORT ---:")
        print(case_report)

        # Process the data as needed
        # For now, we just return the data received
        # return jsonify({
        #     'contractContent': contract_content,
        #     'proformaInvoiceContent': proforma_invoice_content,
        #     'paymentReceiptContent': payment_receipt_content,
        #     'shippingDocumentsContent': shipping_documents_content
        # }), 200
        
        return jsonify({
            'caseReport': case_report
        }), 200
        
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
    
