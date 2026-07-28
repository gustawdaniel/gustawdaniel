---
author: Daniel Gustaw
canonicalName: langchain-exemplary-use-cases
coverImage: /src/assets/images/f618a5e8-e72d-4c62-920f-3ee29b98f8c9.avif
description: Ekstrakcja uporządkowanych danych z faktur PDF i budowanie elastycznego systemu wyszukiwania dokumentów z LangChain i FAISS.
excerpt: Ekstrakcja uporządkowanych danych z faktur PDF i budowanie elastycznego systemu wyszukiwania dokumentów z LangChain i FAISS.
publishDate: 2025-04-20 00:00:00+00:00
slug: pl/langchain-przykladowe-przypadki-uzycia
tags:
- langchain
- openai
- rag
title: Przykłady zastosowania LangChain
updateDate: 2025-04-20 00:00:00+00:00
---

# W tym poście na blogu zobaczymy 2 przykłady:
- Ekstrakcja danych strukturalnych z PDF
- RAG (Odpowiadanie na pytania) z LangChain

## Ekstrakcja danych strukturalnych z faktur PDF przy użyciu LangChain

Cyfryzacja faktur to powszechne zadanie w automatyzacji biznesu - szczególnie gdy są one przesyłane jako zeskanowane pliki PDF. W tym poście pokażemy, jak używać LangChain, 
OpenAI i Pydantic do ekstrakcji danych strukturalnych, takich jak nazwisko klienta, data, numer faktury oraz całkowita wartość z plików PDF.

Zanurzmy się w to! 🚀

### 💡 Cel

Chcemy zbudować skrypt, który akceptuje:

- Fakturę PDF
- Model danych opisujący oczekiwane pola

I zwraca:

- Strukturalny wynik JSON z wyekstrahowanymi wartościami

Może to być bardzo przydatne w scenariuszach takich jak:

- Automatyzacja księgowości
- Integracja faktur z CRM lub ERP
- Zastępowanie ręcznego wprowadzania danych

Użyjemy następujących pakietów:

```bash
pip install langchain openai pydantic pdfplumber langchain-community
```

A oto faktura:

<embed src="https://fra1.digitaloceanspaces.com/preciselab/blog/doc/invoice1.pdf" width="800" height="1180" type="application/pdf">


### 🧱 Krok 1: Zdefiniuj Model Danych

Użyjemy Pydantic, aby zdefiniować, co chcemy wyciągnąć z każdej faktury.

```python
from pydantic import BaseModel

class InvoiceData(BaseModel):
    client: str
    date: str
    invoice_number: str
    total_amount: str
```

### 📄 Krok 2: Wydobywanie tekstu z PDF

Użyjemy pdfplumber, aby uzyskać zawartość tekstową z PDF:

```python
import pdfplumber

def extract_text_from_pdf(path):
    with pdfplumber.open(path) as pdf:
        return "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
```

### 🧠 Krok 3: Skonfiguruj LangChain do Strukturacji Odpowiedzi

LangChain + OpenAI + podpowiedź + model danych = magia ✨

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.output_parsers import PydanticOutputParser
```

Użyjemy podpowiedzi, aby powiedzieć modelowi, czego chcemy:

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

### 🔗 Krok 4: Stwórz łańcuch i parsuj

Łączymy podpowiedź, model i parser:

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

### 🧪 Krok 5: Uruchom i wydrukuj jako JSON

Na koniec uruchamiamy pełny proces i drukujemy wynik:

```python
import json

if __name__ == '__main__':
    result = parse("invoice1.pdf")
    print(json.dumps(result.dict(), indent=2))
```

### ✅ Przykładowy Wynik

```json
{
  "client": "Test Business",
  "date": "January 25, 2016",
  "invoice_number": "INV-3337",
  "total_amount": "$93.50"
}
```

# Budowanie Elastycznego Systemu Wyszukiwania Dokumentów z Langchain i FAISS

Teraz przejdziemy do budowy elastycznego systemu wyszukiwania dokumentów z użyciem Langchain, FAISS i osadzeń OpenAI. Naszym celem jest stworzenie systemu, który pozwala na efektywne przeszukiwanie plików PDF, bez twardego kodowania nazw plików, oraz łatwego rozszerzania na różne przypadki użycia.

Zanurzmy się w to, jak możemy zbudować taki system, utrzymując kod czysty i skalowalny.

### Czego się Nauczysz
- Jak używać Langchain do ładowania i indeksowania dokumentów PDF.
- Jak stworzyć system QA oparty na wyszukiwaniu przy użyciu FAISS i osadzeń OpenAI.
- Jak przekształcić kod, aby stał się elastyczny i modułowy.
- Jak dynamicznie przeszukiwać swoje dokumenty, przekazując nazwę pliku i pytanie w czasie rzeczywistym.

### Dlaczego Używać Langchain i FAISS?

Zanim przejdziemy do kodu, krótko omówmy, dlaczego używamy Langchain i FAISS do tego zadania.

- **Langchain**: Ułatwia budowanie aplikacji wokół LLM (Duże Modele Językowe) poprzez dostarczanie potężnych narzędzi do ładowania dokumentów, dzielenia tekstu, osadzeń i wielu innych.
- **FAISS**: Wyszukiwanie Podobieństwa AI Facebooka (FAISS) to biblioteka do efektywnego wyszukiwania podobieństw i grupowania gęstych wektorów. Umożliwia nam szybkie znajdowanie odpowiednich fragmentów z dużych zbiorów dokumentów na podstawie osadzeń.

Konfiguracja Projektu

Zacznijmy od zainstalowania niezbędnych pakietów. Możesz je zainstalować za pomocą pip:

```python
pip install langchain langchain-openai faiss-cpu
```

Aby skorzystać z ich modelu osadzania, potrzebujesz również klucza API z OpenAI.

### Kluczowe pojęcia w kodzie

Zanim przejdziemy do kodu, rozłóżmy go na części:

- Ładowanie dokumentu: Używamy PyPDFLoader do ładowania zawartości PDF.
- Dzielenie tekstu: Duże pliki PDF mogą zawierać zbyt wiele tekstu do przetworzenia w jednym kroku. Używamy RecursiveCharacterTextSplitter, aby podzielić tekst na mniejsze fragmenty.
- Osadzenia: Używamy osadzeń OpenAI (OpenAIEmbeddings), aby przekształcić tekst w reprezentacje wektorowe.
- Indeks FAISS: Przechowuje i zarządza wektoryzowanym tekstem, umożliwiając szybkie wyszukiwanie podobieństw.
- QA wyszukiwania: Kluczowa funkcjonalność pozwala nam zadawać pytania w odniesieniu do zindeksowanego dokumentu, używając łańcucha RetrievalQA.

Teraz zanurzmy się w sam kod.

### Refaktoryzowany kod

Oto refaktoryzowany kod, który to osiąga:

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

### Analiza kodu

```python
load_or_create_vectorstore(pdf_path, embeddings):
```

Ta funkcja sprawdza, czy istnieje istniejący indeks FAISS. Jeśli tak, ładuje go. W przeciwnym razie przetwarza plik PDF, dzieli go na mniejsze fragmenty i tworzy nowy indeks FAISS.

```python
parse(pdf_path, question):
```

To jest punkt wejścia, w którym możesz podać dowolną ścieżkę do pliku PDF oraz pytanie. Ładowany jest dokument, pobierane są odpowiednie informacje, a pytanie jest zadawane za pomocą łańcucha RetrievalQA wspieranego przez OpenAI.

```python
main():
```

W bloku __main__ określamy dokument i pytanie dynamicznie. Możesz zmienić nazwę pliku i pytanie w czasie rzeczywistym, co sprawia, że ten kod jest elastyczny dla różnych zastosowań.

### Odpowiedzi

W tej chwili czaty dostępne w przeglądarkach, takie jak chatgpt, mają 
możliwość odpowiadania na pytania w oparciu o kontekst dokumentu znalezionego w internecie. 
Dzieje się to dzięki wykorzystaniu osadzeń i magazynów wektorowych do znajdowania odpowiednich fragmentów 
w dokumencie.

Więc jeśli zadacie pytanie o dobrze znany dokument, jak książka "Zemsta" z naszego przykładu, otrzymacie poprawną odpowiedź, ale jeszcze niedawno czaty internetowe odpowiadały bez dostępu do źródeł, a jakość odpowiedzi była znacznie gorsza.

Prezentowana technika nadal jest przydatna dla dokumentów, które nie są dostępne publicznie.

### Wnioski

W tym poście zbudowaliśmy elastyczny system wyszukiwania dokumentów przy użyciu Langchain, FAISS i osadzeń OpenAI. Zrefaktoryzowaliśmy kod, aby był bardziej modularny i dynamiczny, co umożliwia wykonywanie zapytań do dowolnego dokumentu PDF.

To podejście można rozszerzyć na wiele innych zastosowań, takich jak zapytania do różnych formatów dokumentów, stosowanie bardziej zaawansowanych technik NLP lub skalowanie do większego korpusu dokumentów. Nie ma granic!
