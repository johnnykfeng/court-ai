from pinecone import Pinecone, ServerlessSpec
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import JSONLoader
from langchain_community.vectorstores import Pinecone as LangchainPinecone
from langchain_community.document_loaders import PyPDFLoader, UnstructuredWordDocumentLoader
from dotenv import load_dotenv
import os
import re
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME_ALL = os.getenv("INDEX_NAME_ALL")
INDEX_NAME_DOCS = os.getenv("INDEX_NAME_DOCS")
PATH_TO_PDF_1 = os.getenv("PATH_TO_PDF_1")
PATH_TO_PDF_2 = os.getenv("PATH_TO_PDF_2")

loader = PyPDFLoader(PATH_TO_PDF_1)

# Load pages after skipping the first 10
all_pages = loader.load()
relevant_pages = all_pages[10:42]

full_text = " ".join([page.page_content for page in relevant_pages])
cleaned_text = re.sub(r'\s+', ' ', full_text)

def split_articles_and_clauses(text):
    # Split by "Article X" pattern
    articles = re.split(r'(Article\s+\d+)', text)
    structured_data = []

    
    for i in range(1, len(articles), 2):
        article_title = articles[i].strip()
        article_content = articles[i + 1].strip()
        # Break into Clauses    
        clauses = re.split(r'\(\d+\)', article_content)
        clauses = [clause.strip() for clause in clauses if clause.strip()]

        for j, clause in enumerate(clauses):
            clause_id = f"{article_title} Clause ({j + 1})"
            structured_data.append((clause_id, clause))

    return structured_data

structured_data = split_articles_and_clauses(cleaned_text)


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=50
)


# Only applying splitter to text that is too large and ensuring overlap so 
# semantic information is maintained
new_chunks = []
for clause_id, clause_text in structured_data:
    if len(clause_text) > 1000:
        split_chunks = text_splitter.split_text(clause_text)
        for idx, chunk in enumerate(split_chunks):
            new_chunks.append((f"{clause_id}_part_{idx+1}", chunk))
    else:
        new_chunks.append((clause_id, clause_text))

structured_data = new_chunks

# Embeddings
embeddings_model = OpenAIEmbeddings(
    model="text-embedding-ada-002", 
    openai_api_key=OPENAI_API_KEY
)

pc = Pinecone(
    api_key = PINECONE_API_KEY,
)

pc.list_indexes()

index = pc.Index(INDEX_NAME_DOCS)

# Upsert the embeddings.
for clause_id, clause_text in structured_data:
    clause_embedding = embeddings_model.embed_documents([clause_text])[0] 
    metadata = {
        "clause_id": clause_id,
        "article": clause_id.split()[1],  # Extracting 'Article X' from clause_id
        "clause": clause_id.split("Clause")[-1].strip(),  # Extracting clause number
        "text": clause_text,
        "file_name": "United Nations Convention on Contracts for the International Sale of Goods"
    }

    index.upsert([
       {
           "id": clause_id,
           "values": clause_embedding,
           "metadata": metadata 
       }
    ])


loader = PyPDFLoader(PATH_TO_PDF_2)

all_pages = loader.load()
relevant_pages = all_pages[6:]

full_text = " ".join([page.page_content for page in relevant_pages])


#Splitting based on Parts:
parts = re.split(r'(PART [IVXLCDM]+)', full_text, flags=re.IGNORECASE)

# Strucuring document based on contents page
structured_parts = []
for i in range(1, len(parts), 2):
    part_heading = parts[i].strip()
    part_content = parts[i + 1].strip()
    structured_parts.append((part_heading, part_content))


## Splitting by clauses:
sections = []
for part_heading, part_content in structured_parts:
    clauses = re.split(r'\(\d+\)', part_content)

    for idx, clause in enumerate(clauses):
        if clause.strip():
            clause_id = f"{part_heading} - Clause {idx+1}"
            sections.append((clause_id, clause.strip()))



text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)


# Using same as the previous instance with 50 character overlap and 500 character limit
final_chunks = []
for section_id, section_content in sections:
    if len(section_content) > 500:
        chunks = text_splitter.split_text(section_content)
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{section_id} - Chunk {idx+1}"
            final_chunks.append((chunk_id, chunk))
    else: 
        final_chunks.append((section_id, section_content))

for section_id, section_content in final_chunks:
    clause_embedding = embeddings_model.embed_documents([section_content])[0] 
    metadata = {
        "clause_id": section_id,
        "article": section_id.split()[1],  
        "clause": section_id.split("Clause")[-1].strip(), 
        "text": section_content,
        "file_name": "Business Corporations Act"

    }

    index.upsert([
      {
          "id": section_id,
          "values": clause_embedding,
          "metadata": metadata 
      }
    ])
