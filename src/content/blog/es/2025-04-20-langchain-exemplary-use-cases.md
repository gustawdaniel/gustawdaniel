---
author: Daniel Gustaw
canonicalName: langchain-exemplary-use-cases
coverImage: https://ucarecdn.com/f618a5e8-e72d-4c62-920f-3ee29b98f8c9/-/preview/640x360/
description: Extrayendo datos estructurados de facturas en PDF y construyendo un sistema de búsqueda de documentos flexible con LangChain y FAISS.
excerpt: Extrayendo datos estructurados de facturas en PDF y construyendo un sistema de búsqueda de documentos flexible con LangChain y FAISS.
publishDate: 2025-04-20 00:00:00+00:00
slug: es/casos-de-uso-ejemplares-de-langchain
tags:
- langchain
- openai
- rag
title: Casos de Uso Ejemplares de LangChain
updateDate: 2025-04-20 00:00:00+00:00
---

# En este artículo veremos 2 ejemplos:
- Extraer Datos Estructurados de PDF
- RAG (Respuesta a Preguntas) con LangChain

## Extraer Datos Estructurados de Facturas PDF Usando LangChain

La digitalización de facturas es una tarea común en la automatización empresarial, especialmente cuando se envían como PDFs escaneados. En este artículo, mostraremos cómo usar LangChain, 
OpenAI y Pydantic para extraer datos estructurados como el nombre del cliente, la fecha, el número de factura y el valor total de archivos PDF.

¡Profundicemos! 🚀

### 💡 Objetivo

Queremos construir un script que acepte:

- Una factura PDF
- Un modelo de datos que describa los campos que esperamos

Y devuelva:

- Una salida JSON estructurada con los valores extraídos

Esto puede ser muy útil en escenarios como:

- Automatización de contabilidad
- Integración de facturas en CRMs o ERPs
- Reemplazo de la entrada de datos manual

Usaremos los siguientes paquetes:

```bash
pip install langchain openai pydantic pdfplumber langchain-community
```

Y la siguiente factura:

<embed src="https://fra1.digitaloceanspaces.com/preciselab/blog/doc/invoice1.pdf" width="800" height="1180" type="application/pdf">


### 🧱 Paso 1: Definir el Modelo de Datos

Usaremos Pydantic para definir qué queremos extraer de cada factura.

```python
from pydantic import BaseModel

class InvoiceData(BaseModel):
    client: str
    date: str
    invoice_number: str
    total_amount: str
```

### 📄 Paso 2: Extraer texto del PDF

Usaremos pdfplumber para obtener el contenido de texto del PDF:

```python
import pdfplumber

def extract_text_from_pdf(path):
    with pdfplumber.open(path) as pdf:
        return "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
```

### 🧠 Paso 3: Configurar LangChain para la Estructuración de Respuestas

LangChain + OpenAI + un aviso + el modelo de datos = magia ✨

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
```

Usaremos un aviso para decirle al modelo lo que queremos:

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

### 🔗 Paso 4: Crear la Cadena y Analizar

Combinamos el aviso, el modelo y el analizador:

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

### 🧪 Paso 5: Ejecutar e Imprimir como JSON

Finalmente, ejecutamos toda la tubería y imprimimos el resultado:

```python
import json

if __name__ == '__main__':
    result = parse("invoice1.pdf")
    print(json.dumps(result.dict(), indent=2))
```

### ✅ Ejemplo de Salida

```json
{
  "client": "Test Business",
  "date": "January 25, 2016",
  "invoice_number": "INV-3337",
  "total_amount": "$93.50"
}
```

# Construyendo un Sistema de Búsqueda de Documentos Flexible con Langchain y FAISS

Ahora vamos a recorrer la construcción de un sistema de búsqueda de documentos flexible utilizando Langchain, FAISS y las incrustaciones de OpenAI. Nuestro objetivo es crear un sistema que te permita consultar PDFs de manera eficiente, sin codificar nombres de archivos, y fácilmente extensible para diversos casos de uso.

Vamos a explorar cómo podemos construir dicho sistema, manteniendo el código limpio y escalable.

### Lo Que Aprenderás
- Cómo usar Langchain para cargar e indexar documentos PDF.
- Cómo crear un sistema de preguntas y respuestas basado en recuperación utilizando FAISS y las incrustaciones de OpenAI.
- Cómo refactorizar el código para hacerlo flexible y modular.
- Cómo consultar tus documentos dinámicamente pasando el nombre del archivo y la pregunta en tiempo de ejecución.

### ¿Por Qué Usar Langchain y FAISS?

Antes de sumergirnos en el código, discutamos brevemente por qué estamos usando Langchain y FAISS para esta tarea.

- **Langchain**: Simplifica la construcción de aplicaciones alrededor de LLMs (Modelos de Lenguaje Grande) proporcionando herramientas poderosas para la carga de documentos, división de texto, incrustaciones y más.
- **FAISS**: La Búsqueda de Similitud AI de Facebook (FAISS) es una biblioteca para la búsqueda de similitud y agrupamiento de vectores densos de manera eficiente. Nos permite encontrar rápidamente pasajes relevantes de grandes colecciones de documentos basados en incrustaciones.

Configurando el Proyecto

Empecemos por instalar los paquetes necesarios. Puedes instalarlos a través de pip:

```python
pip install langchain langchain-openai faiss-cpu
```

También necesitas una clave de API de OpenAI para usar su modelo de incrustación.

### Conceptos Clave en el Código

Antes de saltar al código, desglosémoslo:

- Carga de Documentos: Usamos PyPDFLoader para cargar el contenido del PDF.
- División de Texto: Los PDFs grandes pueden contener demasiado texto para procesar de una vez. Usamos RecursiveCharacterTextSplitter para dividir el texto en fragmentos más pequeños.
- Incrustaciones: Usamos incrustaciones de OpenAI (OpenAIEmbeddings) para convertir texto en representaciones vectoriales.
- Índice FAISS: Este almacena y gestiona texto vectorizado, permitiendo una búsqueda de similitud rápida.
- Recuperación QA: La funcionalidad principal nos permite hacer preguntas contra el documento indexado usando una cadena RetrievalQA.

Ahora, sumerjámonos en el código mismo.

### El Código Refactorizado

Aquí está el código refactorizado que logra esto:

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

### Desglose del Código

```python
load_or_create_vectorstore(pdf_path, embeddings):
```

Esta función verifica si existe un índice FAISS existente. Si es así, lo carga. De lo contrario, procesa el PDF, lo divide en partes más pequeñas y crea un nuevo índice FAISS.

```python
parse(pdf_path, question):
```

Este es el punto de entrada donde puedes pasar cualquier ruta de PDF y una pregunta. Carga el documento, recupera la información relevante y responde a la pregunta utilizando la cadena RetrievalQA potenciada por OpenAI.

```python
main():
```

En el bloque __main__, especificamos el documento y la pregunta dinámicamente. Puedes cambiar el nombre del archivo y la pregunta sobre la marcha, lo que hace que este código sea flexible para varios casos de uso.

### Respuestas

En este momento, los chats disponibles en navegadores como chatgpt tienen 
la posibilidad de responder preguntas basadas en el contexto del documento encontrado en internet. 
Esto se hace utilizando embeddings y almacenamientos de vectores para encontrar pasajes relevantes 
en el documento.

Así que si haces una pregunta sobre un documento bien conocido como el libro "Zemsta" de nuestro ejemplo, recibirás una respuesta correcta, pero hace poco tiempo los chats web respondían sin acceso a fuentes y la calidad de las respuestas era mucho peor.

La técnica presentada sigue siendo útil para documentos que no están disponibles públicamente.

### Conclusión

En este post, hemos construido un sistema de búsqueda de documentos flexible utilizando Langchain, FAISS y embeddings de OpenAI. Hemos refactorizado el código para hacerlo más modular y dinámico, permitiendo la consulta de cualquier documento PDF.

Este enfoque se puede extender a muchos otros casos de uso, como consultar diferentes formatos de documentos, aplicar técnicas de PNL más avanzadas o escalar a un corpus de documentos más grande. ¡El cielo es el límite!
