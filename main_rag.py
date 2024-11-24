# %%
from rag_functions import *
import os
from dotenv import load_dotenv
load_dotenv()

from langchain_community.document_loaders import TextLoader
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import CharacterTextSplitter
from langchain_chroma import Chroma as chroma
from langchain_community.vectorstores import FAISS
# from PROMPTS import ANSWER_QUESTION_PROMPT
from langchain.prompts import PromptTemplate


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
pdf_file = r"DOCS\Case scenario.pdf"

llm = ChatOpenAI(model = "gpt-4o-mini", 
                 api_key=OPENAI_API_KEY)

# open the docx file
with open(pdf_file, 'rb') as file:
    case_file = file.read()

# convert pdf to text
case_text = get_pdf_text(pdf_file)

# # Split the document into smaller chunks
chunk_size = 1000
chunk_overlap = 100
chunks = split_document(case_text, chunk_size, chunk_overlap)

print(f"Number of chunks: {len(chunks)}")

# %% CREATE VECTOR STORE

embedding_function = get_embedding_function(OPENAI_API_KEY)

db = FAISS.from_documents(chunks, embedding_function)

#%% Q&A with RAG

# query = "What are the details of the buyer?"
query = "Tell me about payment transaction details"
similar_content = db.similarity_search(query)
print(" --- SIMILAR CONTENT --- ")
# print(similar_content[0].page_content)
print(type(similar_content[0].page_content))

ANSWER_QUESTION_PROMPT = """
You are an assistant lawyer helping clients by answering
questions about legal matters.
Use the following pieces of retrieved context to answer
the question. If you don't know the answer, say that you
don't know. DON'T MAKE UP ANYTHING.

{context}

---

Answer the question based on the above context: {question}
"""

# Generate response from similar content
prompt_template = PromptTemplate(input_variables=["context", "question"], template=ANSWER_QUESTION_PROMPT)
prompt = prompt_template.format(context=similar_content[0].page_content, 
                                question=query)

print(prompt)

print("--- RESPONSE ---")   
response = llm.invoke(prompt)
print(response.content)




# %%
