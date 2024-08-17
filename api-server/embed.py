import chromadb
import chromadb.utils.embedding_functions as embedding_functions
import pandas as pd

ollama_ef = embedding_functions.OllamaEmbeddingFunction(
    url="http://localhost:11434/api/embeddings",
    model_name="nomic-embed-text",
)

chroma_client = chromadb.Client()
client = chromadb.PersistentClient(path="./db")

# out with the old
try:
    client.delete_collection(name="operation_list")
    print('✅ old collection deleted')
except:
    print('⚠️ old collection didn\'t exist: skipping')


# in with the new
collection = client.create_collection(name="operation_list", embedding_function=ollama_ef)
print('✅ new collection created')

# add data
df = pd.read_json('oplist.json')
collection.add(
    documents=df["SurgeryProcedure"].to_list(),
    metadatas=list(map(lambda x: {'freq': x}, df["freq"].to_list())),
    ids=df["Code"].to_list()
)
print('✅ embedding complete')