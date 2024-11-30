from flask import Flask, request, jsonify
import os
from flask_cors import CORS


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])
 
@app.route('/upload', methods=['POST'])
def upload_files():
    try:
        # Extract the content from the request body
        contract_content = request.json.get('contractContent')
        proforma_invoice_content = request.json.get('proformaInvoiceContent')
        payment_receipt_content = request.json.get('paymentReceiptContent')
        shipping_documents_content = request.json.get('shippingDocumentsContent')

        print(contract_content)

        # Process the data as needed
        # For now, we just return the data received
        return jsonify({
            'contractContent': contract_content,
            'proformaInvoiceContent': proforma_invoice_content,
            'paymentReceiptContent': payment_receipt_content,
            'shippingDocumentsContent': shipping_documents_content
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
