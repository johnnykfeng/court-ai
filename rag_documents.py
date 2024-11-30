# %%
from langchain.prompts import PromptTemplate
from PROMPTS import ANSWER_QUESTION_PROMPT, TRANSLATE_TO_SIMPLE_CHINESE_PROMPT
from langchain_community.vectorstores import Pinecone  # Pinecone integration for vector store
from pinecone import Pinecone as PineconeClient
from langchain.vectorstores import Pinecone
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.document_loaders import TextLoader
from rag_functions import *
from langchain_community.chat_models import ChatOpenAI
import os
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
INDEX_NAME_DOCS = os.getenv("INDEX_NAME_DOCS")


llm = ChatOpenAI(model_name="gpt-4", openai_api_key=OPENAI_API_KEY)
pc = PineconeClient(
    api_key=os.environ.get("PINECONE_API_KEY")
)


# %% Q&A WITH RAG
# Connect to the Pinecone index
index_name = INDEX_NAME_DOCS
index = pc.Index(index_name)
embedding_function = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY, model='text-embedding-ada-002')

query = input("Enter your question: ")

query_embedding = embedding_function.embed_query(query)

print(query_embedding)

# Retrieve similar content using similarity search
similar_content = index.query(vector=query_embedding, top_k=5, include_metadata=True)
print(" --- SIMILAR CONTENT --- ")
print(f"Number of retrieved content: {len(similar_content['matches'])}")


# Concatenate all the similar content
similar_content_text = " ".join(
    [match['metadata'].get("text", "") for match in similar_content["matches"]])

prompt_template = PromptTemplate(
    input_variables=["context", "question"],
    template=ANSWER_QUESTION_PROMPT
)
final_prompt = prompt_template.format(
    context=similar_content_text,
    question=query
)

print(final_prompt)

print("--- RESPONSE ---")
response = llm.invoke(final_prompt)
print(response.content)

print("--- CHINESE RESPONSE ---")
translate_prompt = PromptTemplate(input_variables=["english_text"],
                                 template=TRANSLATE_TO_SIMPLE_CHINESE_PROMPT)
translate_prompt = translate_prompt.format(english_text=response.content)

print(llm.invoke(translate_prompt).content)

# %%
