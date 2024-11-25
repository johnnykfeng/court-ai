# %%
from langchain.prompts import PromptTemplate
from PROMPTS import ANSWER_QUESTION_PROMPT, TRANSLATE_TO_SIMPLE_CHINESE_PROMPT
from langchain_community.vectorstores import FAISS  # THIS IS WORKING!
# from langchain_chroma import Chroma as chroma  # CHROMA ISN"T WORKING!
from langchain_text_splitters import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader
from rag_functions import *
import os
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
llm = ChatOpenAI(model="gpt-4o-mini",
                 api_key=OPENAI_API_KEY)

#%% GET MARKDOWN TEXT
markdown_file = r"DOCS\scraped_headers.md"
case_text = get_markdown_text(markdown_file)

#%%
pdf_file = r"DOCS\Case scenario.pdf"
# open the docx file
with open(pdf_file, 'rb') as file:
    case_file = file.read()

case_text = get_pdf_text(pdf_file)

#%%
# # Split the document into smaller chunks
chunk_size = 500
chunk_overlap = 100
chunks = split_document(case_text, chunk_size, chunk_overlap)

print(f"Number of chunks: {len(chunks)}")
print(f"++ FIRST CHUNK ++ \n {chunks[0]}")
print(f"++ LAST CHUNK ++ \n {chunks[-1]}")

# %% CREATE VECTOR STORE
embedding_function = get_embedding_function(OPENAI_API_KEY)

db = FAISS.from_documents(chunks, embedding_function)

# %% Q&A with RAG

# query = "What are the details of the buyer?"
# query = "What are potential risks in the transaction?"
query = input("Enter your question: ")

similar_content = db.similarity_search(query)
print(" --- SIMILAR CONTENT --- ")
print(f"Number of retrieved content {len(similar_content)}")
# concatenate all the similar content
similar_content_text = " ".join(
    [content.page_content for content in similar_content])


# Generate response from similar content
prompt_template = PromptTemplate(input_variables=["context", "question"],
                                 template=ANSWER_QUESTION_PROMPT)
final_prompt = prompt_template.format(
    context=similar_content_text,
    question=query)

print("--- RESPONSE ---")
response = llm.invoke(final_prompt)
print(response.content)

print("--- CHINESE RESPONSE ---")
translate_prompt = PromptTemplate(input_variables=["english_text"],
                                 template=TRANSLATE_TO_SIMPLE_CHINESE_PROMPT)
translate_prompt = translate_prompt.format(english_text=response.content)

print(llm.invoke(translate_prompt).content)

# %%
