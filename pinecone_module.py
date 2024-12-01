# %%
from langchain.prompts import PromptTemplate
from PROMPTS import *
from langchain_community.vectorstores import Pinecone
from pinecone import Pinecone as PineconeClient
from langchain_openai import OpenAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME_DOCS = os.getenv("INDEX_NAME_DOCS")

pc = PineconeClient(
    api_key=os.environ.get("PINECONE_API_KEY")
)

# %% Connect to the Pinecone index
def get_similar_content(query, top_k=5):
    index = pc.Index(INDEX_NAME_DOCS)
    embedding_function = OpenAIEmbeddings(
        openai_api_key=OPENAI_API_KEY, model='text-embedding-ada-002')

    query_embedding = embedding_function.embed_query(query)

    # Retrieve similar content using similarity search
    similar_content = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True)

    print(f"Number of retrieved content: {len(similar_content['matches'])}")

    # Concatenate all the similar content
    similar_content_texts = []
    for i, match in enumerate(similar_content["matches"]):
        similar_content_texts.append(f"\n\n--- Retrieved Content {i+1} ---\n")
        similar_content_texts.append(
            f"file_name: {match['metadata'].get('file_name', '')}\n")
        similar_content_texts.append(
            f"clause_id: {match['metadata'].get('clause_id', '')}\n")
        similar_content_texts.append(
            f"article: {match['metadata'].get('article', '')}\n")
        similar_content_texts.append(match['metadata'].get("text", ""))

    similar_content_combined = "".join(similar_content_texts)

    return similar_content_combined

if __name__ == "__main__":
    query = "Conformity of the goods and third-party claims"
    print(get_similar_content(query))


# %%
