---
author: Daniel Gustaw
canonicalName: langchain-exemplary-use-cases
coverImage: https://ucarecdn.com/f618a5e8-e72d-4c62-920f-3ee29b98f8c9/-/preview/640x360/
description: Extracting structured data from PDF invoices and building a flexible document search system with LangChain and FAISS.
excerpt: Extracting structured data from PDF invoices and building a flexible document search system with LangChain and FAISS.
publishDate: 2025-04-20 00:00:00+00:00
slug: en/langchain-exemplary-use-cases
tags:
  - langchain
  - openai  
  - rag
title: LangChain Exemplary Use Cases
updateDate: 2025-04-20 00:00:00+00:00
---

# In this blog post we will see 2 examples:
- Extract Structured Data from PDF
- RAG (Question Answering) with LangChain

## Extract Structured Data from PDF Invoices Using LangChain

Digitizing invoices is a common task in business automation — especially when they're sent as scanned PDFs. In this post, we'll show how to use LangChain, 
OpenAI, and Pydantic to extract structured data like client name, date, invoice number, and total value from PDF files.

Let’s dive in! 🚀

### 💡 Goal

We want to build a script that accepts:

- A PDF invoice
- A data model describing the fields we expect

And returns:

- A structured JSON output with the extracted values

This can be very useful in scenarios like:

- Automating accounting
- Integrating invoices into CRMs or ERPs
- Replacing manual data entry

We will use following packages:

```bash
pip install langchain openai pydantic pdfplumber langchain-community
```

And the following invoice:

<embed src="https://fra1.digitaloceanspaces.com/preciselab/blog/doc/invoice1.pdf" width="800" height="1180" type="application/pdf">


### 🧱 Step 1: Define the Data Model

We'll use Pydantic to define what we want to extract from each invoice.


```python
from pydantic import BaseModel

class InvoiceData(BaseModel):
    client: str
    date: str
    invoice_number: str
    total_amount: str
```

### 📄 Step 2: Extract Text from PDF

We'll use pdfplumber to get text content from the PDF:

```python
import pdfplumber

def extract_text_from_pdf(path):
    with pdfplumber.open(path) as pdf:
        return "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
```


### 🧠 Step 3: Set Up LangChain for Response Structuring

LangChain + OpenAI + a prompt + the data model = magic ✨

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
```

We’ll use a prompt to tell the model what we want:

```python
template = """
Extract the following information from the text below:
- Client name
- Date
- Invoice number
- Total value for payment

{format_instructions}

Text:
{text}
"""
```

### 🔗 Step 4: Create the Chain and Parse

We combine the prompt, the model, and the parser:

```python
from langchain_core.runnables import Runnable

def parse(invoice_path):
    llm = ChatOpenAI(temperature=0)
    parser = PydanticOutputParser(pydantic_object=InvoiceData)

    prompt = PromptTemplate(
        input_variables=["text"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
        template=template
    )

    chain = prompt | llm | parser

    pdf_text = extract_text_from_pdf(invoice_path)
    return chain.invoke({"text": pdf_text})
```

### 🧪 Step 5: Run and Print as JSON

Finally, we run the full pipeline and print the result:

```python
import json

if __name__ == '__main__':
    result = parse("invoice1.pdf")
    print(json.dumps(result.dict(), indent=2))
```

### ✅ Example Output

```json
{
  "client": "Test Business",
  "date": "January 25, 2016",
  "invoice_number": "INV-3337",
  "total_amount": "$93.50"
}
```

# Building a Flexible Document Search System with Langchain and FAISS

Now we will walk through building a flexible document search system using Langchain, FAISS, and OpenAI embeddings. Our goal is to create a system that allows you to query PDFs efficiently, without hardcoding file names, and easily extendable for various use cases.

Let’s dive into how we can build such a system, while keeping the code clean and scalable.

### What You Will Learn
- How to use Langchain to load and index PDF documents.
- How to create a retrieval-based QA system using FAISS and OpenAI embeddings.
- How to refactor code to make it flexible and modular.
- How to query your documents dynamically by passing the file name and question at runtime.

### Why Use Langchain and FAISS?

Before we dive into the code, let’s briefly discuss why we’re using Langchain and FAISS for this task.

- **Langchain**: It simplifies building applications around LLMs (Large Language Models) by providing powerful tools for document loading, text splitting, embeddings, and more.
- **FAISS**: Facebook’s AI Similarity Search (FAISS) is a library for efficient similarity search and clustering of dense vectors. It allows us to quickly find relevant passages from large collections of documents based on embeddings.

Setting Up the Project

Let’s start by installing the necessary packages. You can install them via pip:

```python
pip install langchain langchain-openai faiss-cpu
```

You also need an API key from OpenAI to use their embedding model.

### Key Concepts in the Code

Before jumping to the code, let’s break it down:

- Document Loading: We use PyPDFLoader to load the PDF content.
- Text Splitting: Large PDFs can contain too much text to process at once. We use RecursiveCharacterTextSplitter to break the text into smaller chunks.
- Embeddings: We use OpenAI embeddings (OpenAIEmbeddings) to convert text into vector representations.
- FAISS Index: This stores and manages vectorized text, enabling fast similarity search.
- Retrieval QA: The core functionality allows us to ask questions against the indexed document using a RetrievalQA chain.

Now, let’s dive into the code itself.

### The Refactored Code

Here is the refactored code that achieves this:

```python
import os
import logging
from typing import Optional

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INDEX_PATH = "faiss_book_index"

def load_or_create_vectorstore(pdf_path: str, embeddings: OpenAIEmbeddings) -> FAISS:
    """Load FAISS index if it exists; otherwise create it from the PDF."""
    if os.path.exists(INDEX_PATH):
        logger.info("Loading existing FAISS index...")
        return FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)

    logger.info("Creating new FAISS index from PDF...")
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    doc_chunks = text_splitter.split_documents(docs)

    vectorstore = FAISS.from_documents(doc_chunks, embeddings)
    vectorstore.save_local(INDEX_PATH)
    return vectorstore

def parse(pdf_path: str, question: str) -> str:
    """Process PDF and ask question using retrieval QA."""
    embeddings = OpenAIEmbeddings()
    vectorstore = load_or_create_vectorstore(pdf_path, embeddings)

    retriever = vectorstore.as_retriever()
    qa_chain = RetrievalQA.from_chain_type(
        llm=ChatOpenAI(model_name="gpt-4-turbo"),
        retriever=retriever
    )

    response = qa_chain.invoke(question)
    return response["result"]

if __name__ == '__main__':
    question = 'ALEKSANDER FREDRO w utworze "Zemsta" umieścił werset: "jeśli nie chcesz mojej zguby, ___ daj mi luby", czym jest ___? Co luby ma dać osobie wypowiadającej ten cytat?'
    pdf_file = "zemsta.pdf"
    answer = parse(pdf_file, question)
    print(answer)
```

### Code Breakdown

```
load_or_create_vectorstore(pdf_path, embeddings):
```

This function checks whether an existing FAISS index exists. If it does, it loads it. Otherwise, it processes the PDF, splits it into smaller chunks, and creates a new FAISS index.

```
parse(pdf_path, question):
```

This is the entry point where you can pass any PDF path and a question. It loads the document, retrieves the relevant information, and answers the question using the RetrievalQA chain powered by OpenAI.

```
main():
```

In the __main__ block, we specify the document and the question dynamically. You can change the file name and question on the fly, making this code flexible for various use cases.

### Answers

At this moment chats available in browsers like chatgpt have 
possibility to answer questions based on the context of the document found over internet. 
This is done by using embeddings and vector stores to find relevant passages 
in the document.

So if you will ask a question about well known document like book "Zemsta" from our example, you will receive correct answer, but short time ago web chats was answering without access to sources and quality of answers was much worse.

Presented technique is still useful for documents that are not publicly available.

### Conclusion

In this post, we’ve built a flexible document search system using Langchain, FAISS, and OpenAI embeddings. We’ve refactored the code to make it more modular and dynamic, enabling the querying of any PDF document.

This approach can be extended to many other use cases, such as querying different document formats, applying more advanced NLP techniques, or scaling up to a larger document corpus. The sky's the limit!