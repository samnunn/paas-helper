import chromadb
import json
import pandas as pd
from flask import Flask, render_template, session, redirect, request, url_for, abort, send_from_directory
from werkzeug.exceptions import HTTPException
import chromadb.utils.embedding_functions as embedding_functions
import timeit

#    _____ _           _      ____       _                                        
#   |  ___| | __ _ ___| | __ / ___|  ___| |_ _   _ _ __                           
#   | |_  | |/ _` / __| |/ / \___ \ / _ \ __| | | | '_ \                          
#   |  _| | | (_| \__ \   <   ___) |  __/ |_| |_| | |_) |                         
#   |_|   |_|\__,_|___/_|\_\ |____/ \___|\__|\__,_| .__/                          
#                                                 |_|                                             

app = Flask(__name__)
DEVELOPMENT_ENV = True
FREQUENCY_WEIGHT = 2


#       _    ___   ____       _                                                   
#      / \  |_ _| / ___|  ___| |_ _   _ _ __                                      
#     / _ \  | |  \___ \ / _ \ __| | | | '_ \                                     
#    / ___ \ | |   ___) |  __/ |_| |_| | |_) |                                    
#   /_/   \_\___| |____/ \___|\__|\__,_| .__/                                     
#                                      |_|                  

# Create a custom embedding function for nomic-embed via ollama
ollama_ef = embedding_functions.OllamaEmbeddingFunction(
    url="http://localhost:11434/api/embeddings",
    model_name="nomic-embed-text",
)

# ChromaDB setup
chroma_client = chromadb.Client()
client = chromadb.PersistentClient(path="./db")
collection = client.get_collection("operation_list", embedding_function=ollama_ef)

#    _   _ _   _ _ _ _           _____                 _   _                      
#   | | | | |_(_) (_) |_ _   _  |  ___|   _ _ __   ___| |_(_) ___  _ __  ___      
#   | | | | __| | | | __| | | | | |_ | | | | '_ \ / __| __| |/ _ \| '_ \/ __|     
#   | |_| | |_| | | | |_| |_| | |  _|| |_| | | | | (__| |_| | (_) | | | \__ \     
#    \___/ \__|_|_|_|\__|\__, | |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/     
#                        |___/                                                    

ABBREVIATIONS = {
    "THR": "total hip replacement",
    "TKR": "total knee replacement",
}

def expand_abbreviations(input: str):

    return input

def search(query):
    # Embed and cosine retrieve
    results = collection.query(
        query_texts=[query],
        n_results=20
    )

    # Zip results
    # [[a,b,c], [1,2,3]] becomes [(a,1), (b,2), (c,3)]
    results = zip(
        results['ids'][0],
        results['distances'][0],
        results['documents'][0],
        results['metadatas'][0],
    )

    # Force change to List() type
    results = [list(x) for x in results]

    # Apply frequency bias
    for r in results:
        frequency = float(r[3]['freq'])
        r[1] = r[1]/(frequency ** FREQUENCY_WEIGHT)

    # Re-sort according to frequency-biased distance
    results = sorted(results, key=lambda x: x[1])

    return results

#    ____             _                                                           
#   |  _ \ ___  _   _| |_ ___  ___                                                
#   | |_) / _ \| | | | __/ _ \/ __|                                               
#   |  _ < (_) | |_| | ||  __/\__ \                                               
#   |_| \_\___/ \__,_|\__\___||___/                                               

@app.route("/")
def index():
    return send_from_directory('templates', 'index.html')

@app.route("/search", methods=['GET', 'POST'])
def api():
    if request.method == "POST":
        start = timeit.default_timer()
        # Get form input
        query = request.form.get('embed')
        results = search(query)
        print("Time for inference:", timeit.default_timer() - start)
        return results

    return """
    <form method="POST" action="/">
    <input type="search" name="embed">
    <input type="submit" value="go">
    </form>
    """

if __name__ == "__main__":
    app.run(debug=DEVELOPMENT_ENV)