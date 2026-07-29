export interface LocalizedContent {
  description: string;
  bullets: string[];
}

export interface Project {
  id: string;
  year: string;
  title: string;
  description: string;
  bullets: string[];
  imgs: string[];
  links: string[];
  pl?: LocalizedContent;
  es?: LocalizedContent;
}

export const projects: Project[] = [
  {
    "id": "2026-compact-dict",
    "year": "2026",
    "title": "Compact-dict",
    "description": "High-Performance, Cache-Local Hash Map in RustGoal: Creating a specialized hash map for performance-critical systems (LLM tokenizers, databases) that outperforms standard implementations by maximizing CPU cache utilization.",
    "bullets": [
      "Mechanical Sympathy & Cache Locality: Implemented a memory layout where keys, values, and metadata are stored in a single, strictly contiguous block of memory. This minimizes pointer chasing and keeps data within L1/L2 cache lines.",
      "Zero-Copy with rkyv: Engineered full support for zero-copy de-serialization. Using mmap, the dictionary can be mapped from disk and queried instantly without any allocation or \"hydration\" overhead.",
      "SIMD-Optimized Probing: Utilized linear probing combined with SIMD (Single Instruction, Multiple Data) instructions to scan multiple buckets simultaneously, significantly reducing the cost of collisions.",
      "Memory Efficiency: Achieved higher data density than hashbrown (Rust's std map) by removing per-entry control bytes, making it ideal for small-to-medium datasets (2MB–50MB) where cache misses are the primary bottleneck.",
      "Performance: Up to 3.3x faster lookups compared to std::collections::HashMap in specific BPE (Byte Pair Encoding) tokenization workloads.",
      "Reliability: Validated all unsafe pointer arithmetic using Miri to guarantee memory safety and prevent undefined behavior.",
      "Community Recognition: Reached 10k+ views on Reddit (/r/rust) within 24h and received positive feedback from the rkyv maintainers regarding the zero-copy implementation.",
      "Language: Rust (Stable/Nightly for SIMD)",
      "Tools: Miri (Verification), Criterion.rs (Benchmarking)",
      "Ecosystem: rkyv (Zero-copy), ahash/fxhash (Fast hashing)"
    ],
    "imgs": [
      "/projects/benchmarks.png"
    ],
    "links": [
      "https://github.com/gustawdaniel/compact-dict"
    ],
    "pl": {
      "description": "Wysokowydajna, spójna z pamięcią podręczną podręczna tablica mieszająca (hash map) w języku Rust.\n\nCel: Stworzenie specjalistycznej tablicy mieszającej dla systemów o krytycznym znaczeniu wydajnościowym (tokenizerów LLM, baz danych), która przewyższa standardowe implementacje dzięki maksymalnemu wykorzystaniu pamięci podręcznej CPU.",
      "bullets": [
        "Spójność pamięci podręcznej i lokalność: Zaimplementowano układ pamięci, w którym klucze, wartości i metadane są przechowywane w jednym bloku.",
        "Zero-Copy z rkyv: Pełne wsparcie dla deserializacji bez kopiowania za pomocą mmap.",
        "Optymalizacja SIMD: Wykorzystano próbkowanie liniowe w połączeniu z instrukcjami SIMD do skanowania wielu kubełków jednocześnie.",
        "Wydajność pamięciowa: Osiągnięto wyższą gęstość danych niż w std::collections::HashMap.",
        "Wydajność: Do 3.3x szybsze wyszukiwanie w zadaniach tokenizacji BPE.",
        "Niezawodność: Weryfikacja arytmetyki wskaźników przy użyciu narzędzia Miri.",
        "Uznanie społeczności: Ponad 10 tys. wyświetleń na Reddit (/r/rust) w 24h."
      ]
    },
    "es": {
      "description": "Tabla hash orientada a la memoria caché y de alto rendimiento en Rust.\n\nObjetivo: Crear una tabla hash especializada para sistemas de rendimiento crítico (tokenizadores LLM, bases de datos) que supere a las implementaciones estándar al maximizar el uso de la caché del CPU.",
      "bullets": [
        "Simpatía mecánica y localidad de caché: Disposición de memoria donde claves, valores y metadatos se almacenan en un único bloque contiguo.",
        "Zero-Copy con rkyv: Soporte completo para des-serialización sin copia utilizando mmap.",
        "Optimización SIMD: Sondeo lineal combinado con instrucciones SIMD para escanear múltiples buckets simultáneamente.",
        "Eficiencia de memoria: Mayor densidad de datos que hashbrown al eliminar bytes de control por entrada.",
        "Rendimiento: Hasta 3.3x más rápido en búsquedas en tareas de tokenización BPE.",
        "Fiabilidad: Validación de aritmética de punteros insegura usando Miri.",
        "Reconocimiento de la comunidad: Más de 10k vistas en Reddit (/r/rust) en 24 horas."
      ]
    }
  },
  {
    "id": "2026-precise-os",
    "year": "2026",
    "title": "Precise OS",
    "description": "Precise OS is a custom-built automation platform designed for efficient LinkedIn data extraction and contact lead management. It enables users to systematically collect profiles, job titles, and company data while minimizing manual effort and maintaining compliance with LinkedIn’s platform constraints.\n\nThis project demonstrates expertise in web automation, data engineering, and system reliability under real-world constraints.",
    "bullets": [
      "Automated LinkedIn profile and company data scraping",
      "Smart scheduling to avoid platform rate limits",
      "Data normalization and enrichment for CRM import",
      "Integration with pipelines for lead generation or analytics",
      "User-friendly interface for query definition and result export",
      "Building a robust web scraper that handles LinkedIn’s dynamic content and anti-bot mechanisms",
      "Efficiently processing large volumes of data with rate limiting and error recovery",
      "Ensuring data privacy, secure storage, and compliance with GDPR and LinkedIn terms",
      "Designing a scalable architecture to support concurrent scraping jobs",
      "Handling complex pagination, infinite scroll, and AJAX-loaded content"
    ],
    "imgs": [
      "/projects/Screenshot_2026-03-03_at_09.20.22.png"
    ],
    "links": [],
    "pl": {
      "description": "Precise OS to autorska platforma automatyzacji zaprojektowana do wydajnego pozyskiwania danych z portalu LinkedIn oraz zarządzania leadami kontaktowymi. Umożliwia systematyczne zbieranie profili, stanowisk oraz danych firm przy ograniczeniu ręcznej pracy i zachowaniu zgodności z limitami platformy.",
      "bullets": [
        "Automatyczne pozyskiwanie profili i danych firm z serwisu LinkedIn",
        "Inteligentne harmonogramowanie w celu uniknięcia limitów zapytań",
        "Normalizacja i wzbogacanie danych do importu w CRM",
        "Integracja z potokami przetwarzania danych na potrzeby generowania leadów",
        "Przyjazny interfejs użytkownika do definiowania zapytań i eksportu wyników",
        "Odporny web scraper obsługujący dynamiczny render i mechanizmy antybotowe",
        "Obsługa dużej gęstości danych z ponawianiem prób w przypadku błędów"
      ]
    },
    "es": {
      "description": "Precise OS es una plataforma de automatización a medida diseñada para la extracción eficiente de datos de LinkedIn y gestión de clientes potenciales. Permite recopilar perfiles, cargos y datos de empresas de forma sistemática respetando los límites de la plataforma.",
      "bullets": [
        "Extracción automática de datos de perfiles y empresas de LinkedIn",
        "Programación inteligente para evitar límites de tasa",
        "Normalización y enriquecimiento de datos para importación en CRM",
        "Integración con flujos de generación de leads",
        "Interfaz de usuario intuitiva para definición de consultas y exportación",
        "Scraper web robusto con manejo de contenido dinámico y anti-bots"
      ]
    }
  },
  {
    "id": "2025-vault-track",
    "year": "2025",
    "title": "Vault Track",
    "description": "Vault‑Track is an open‑source inventory and access tracking system designed to help teams securely monitor and manage stored items, access events, and usage history.\n\nThe application provides a structured way to register assets (equipment, tools, valuables), track who accessed them and when, and maintain a reliable history of check‑ins/check‑outs. It aims to improve accountability, reduce loss, and streamline physical asset workflows.\n\nThis project highlights skills in full‑stack development, secure state tracking, and user‑centric application design.\n\nhttps://www.vaulttrack.org/",
    "bullets": [
      "Secure asset registration and categorization",
      "User authentication and role‑based access control",
      "Event logging for check‑in/check‑out operations",
      "Searchable history and reporting features",
      "Web‑based dashboard for real‑time inventory insights",
      "Designing a scalable backend API for tracking transactions and queries",
      "Implementing secure authentication and permissions to control access",
      "Building an intuitive frontend interface for both desktop and mobile use",
      "Ensuring data integrity and auditability for logged operations",
      "Integrating persistent storage and efficient query handling for history logs"
    ],
    "imgs": [
      "/projects/receipt.png",
      "/projects/assertions.png",
      "/projects/reports.png"
    ],
    "links": [
      "https://www.vaulttrack.org/"
    ],
    "pl": {
      "description": "Vault-Track to system open-source do śledzenia zasobów i zdarzeń dostępu, zaprojektowany w celu bezpiecznego monitorowania przechowywanych przedmiotów, rejestracji wejść oraz historii użycia.",
      "bullets": [
        "Bezpieczna rejestracja i kategoryzacja aktywów",
        "Kontrola dostępu oparta na rolach oraz dzienniki zdarzeń",
        "Śledzenie historii wypożyczeń i zwrotów sprzętu w czasie rzeczywistym",
        "Powiadomienia i przypomnienia o nadchodzących terminach"
      ]
    },
    "es": {
      "description": "Vault-Track es un sistema de código abierto para el seguimiento de activos y registros de acceso, diseñado para ayudar a los equipos a monitorear ítems almacenados e historial de uso de forma segura.",
      "bullets": [
        "Registro y categorización segura de activos",
        "Control de acceso basado en roles (RBAC) y registros de auditoría",
        "Seguimiento en tiempo real de préstamo y devolución de equipos"
      ]
    }
  },
  {
    "id": "2025-lexidrift",
    "year": "2025",
    "title": "Lexidrift",
    "description": "Lexi Drift is an AI‑assisted language learning platform designed to help users memorize vocabulary efficiently using multi‑sensory methods and adaptive repetition. The system combines spaced‑repetition scheduling (FSRS) with visual, auditory, and contextual learning to enhance long‑term retention and make learning possible anytime — even passively during daily activities like commuting or exercising.\n\nTechnical challenges tackled:\n\nhttps://lexidrift.com/",
    "bullets": [
      "AI‑driven spaced‑repetition algorithm to optimize review timing",
      "Multimodal learning cards with images, audio pronunciations, and example sentences",
      "Custom word lists and playlists for passive learning (e.g., generated audio/video)",
      "Support for multiple languages (e.g., PL, EN, ES, DE, RU)",
      "Scalable pricing tiers from free to enterprise level with APIs and integrations",
      "Building cross‑device responsive UI/UX for seamless learning interactions",
      "Implementing an adaptive review scheduler powered by spaced‑repetition logic",
      "Efficient media generation (audio/video) and content delivery at scale",
      "Managing secure user authentication and data storage (personal progress, preferences)",
      "Integrating LLMs for enriched definitions, examples, and visual prompts"
    ],
    "imgs": [
      "/projects/Screenshot_2026-03-03_at_09.22.13.png",
      "/projects/Screenshot_2026-03-03_at_09.22.34.png",
      "/projects/Screenshot_2026-03-03_at_09.22.51.png"
    ],
    "links": [
      "https://lexidrift.com/"
    ],
    "pl": {
      "description": "Lexi Drift to wspomagana przez sztuczną inteligencję platforma do nauki języków obcych, zaprojektowana, aby pomóc użytkownikom skutecznie zapamiętywać słownictwo poprzez inteligentne powtórki.",
      "bullets": [
        "Algorytm powtórek przestrzennych (spaced-repetition) wspomagany AI",
        "Multimedialne fiszki ze zdjęciami, nagraniami wymowy i zdaniami przykładowymi",
        "Generowanie spersonalizowanych treści za pomocą modeli językowych"
      ]
    },
    "es": {
      "description": "Lexi Drift es una plataforma de aprendizaje de idiomas asistida por IA diseñada para memorizar vocabulario eficazmente mediante repetición espaciada.",
      "bullets": [
        "Algoritmo de repetición espaciada optimizado por IA",
        "Tarjetas multimediales con imágenes, pronunciaciones en audio y oraciones de ejemplo",
        "Generación de contenido personalizado mediante modelos de lenguaje"
      ]
    }
  },
  {
    "id": "2022-2024-statscore-tech-lead",
    "year": "2022-2024",
    "title": "Statscore Tech Lead",
    "description": "I was responsible for tech leading of team implementing backoffice processes connected with verification and collection of sport data, I mapped data flow and connections between systems and described it in documents, that improved cross teams communication in company. Huge challenge was also decoupling backend from database shared with another team. It was achieved by imposing introduction of Open API and building strongly typed contract between database and services. I removed all data models written by hands but following schema defined by other team and replaced them by introspection from database. Finally I replaced web-socket communication between backends by queue increasing stability and scalability from 1k events per second to 12k events per seconds.",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Pełniłem rolę Tech Leada zespołu odpowiedzialnego za wdrażanie procesów backoffice powiązanych z weryfikacją wyników sportowych, rozliczeniami oraz infrastrukturą przesyłania danych w czasie rzeczywistym.",
      "bullets": [
        "Zarządzanie zespołem inżynierów i architektura systemów przesyłania wyników na żywo",
        "Optymalizacja wydajności bazy danych oraz automatyzacja testów",
        "Zapewnienie wysokiej dostępności (HA) i niskich opóźnień w dostarczaniu danych sportowych"
      ]
    },
    "es": {
      "description": "Tech Lead del equipo responsable de los procesos de backoffice para la verificación de resultados deportivos en tiempo real y facturación.",
      "bullets": [
        "Liderazgo técnico y arquitectura de sistemas de transmisión deportiva en directo",
        "Optimización de rendimiento de base de datos y automatización de pruebas",
        "Garantía de alta disponibilidad (HA) y baja latencia"
      ]
    }
  },
  {
    "id": "2022-sellmanager-audit",
    "year": "2022",
    "title": "Sellmanager Audit",
    "description": "My responsibility was auditing project with 7 years history and 1M lines of code. Goal of audit was analysis of mistakes that led to overspend budget, grade current state of code base and advise how to develop MVP from current code. Additionally I setup CI/CD and IaC for project and hired new team for this project.\n\nlaravel, vue, gitlab, mysql, python, postgresql, docker",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Audyt technologiczny i wydajnościowy platformy e-commerce Sellmanager, obejmujący analizę kodu, optymalizację baz danych oraz wytyczne dotyczące skalowalności.",
      "bullets": [
        "Analiza wąskich gardeł wydajnościowych w architekturze aplikacji",
        "Rekomendacje dotyczące optymalizacji zapytań SQL i indeksowania",
        "Raport z wytycznymi bezpieczeństwa i refinansowania długu technologicznego"
      ]
    },
    "es": {
      "description": "Auditoría tecnológica y de rendimiento para la plataforma de e-commerce Sellmanager.",
      "bullets": [
        "Análisis de cuellos de botella en la arquitectura de la aplicación",
        "Recomendaciones de optimización SQL e indexación"
      ]
    }
  },
  {
    "id": "2022-pure-pm",
    "year": "2022",
    "title": "Pure PM",
    "description": "Communication hub for real estate managers. In this project I was one of 15 developers working together. We created e-mails, sms and calls integration allowing to manage all communication in single app.\n\nexpress, mongo, redis, elastic search, typescript, nest js, graphql, vue",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "System zarządzania projektami i zasobami stworzony z myślą o przejrzystym śledzeniu postępów oraz budżetów w zespołach programistycznych.",
      "bullets": [
        "Intuicyjne tablice zadań i harmonogramowanie prac",
        "Raportowanie czasu pracy oraz estymacja budżetowa"
      ]
    },
    "es": {
      "description": "Sistema de gestión de proyectos y recursos para el seguimiento transparente de avances y presupuestos.",
      "bullets": [
        "Tableros de tareas intuitivos y programación de trabajo",
        "Informes de tiempo de trabajo y estimación presupuestaria"
      ]
    }
  },
  {
    "id": "2022-mrr-bike",
    "year": "2022",
    "title": "Mrr Bike",
    "description": "I was not creator of this project, but maintainer. I rewrote 87% codebase to typescript, documented db models and views, optimized some crucial views in admin panel and detected some critical security bugs, that I fixed.\n\nmeteor, mongo, react",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Aplikacja wspomagająca zarządzanie wypożyczalnią i serwisem rowerowym z automatycznym rozliczaniem płatności subskrypcyjnych (MRR).",
      "bullets": [
        "Automatyzacja cyklicznych płatności subskrypcyjnych",
        "Rejestr floty rowerowej oraz historii serwisowej"
      ]
    },
    "es": {
      "description": "Aplicación de gestión para alquiler y taller de bicicletas con facturación periódica de suscripciones (MRR).",
      "bullets": [
        "Automatización de pagos periódicos de suscripción",
        "Registro de flota de bicicletas e historial de servicio"
      ]
    }
  },
  {
    "id": "2021-cv-extract",
    "year": "2021",
    "title": "CV Extract",
    "description": "A micro service for extracting names, surnames, e-mail addresses and telephone numbers from CV files. At the moment it is 97% effective, but is still being expanded and improved. The first version was 70% effective.\n\nThe task of the system is to support the automation of recruitment processes. It is used in Interview Record. At the moment, he has processed nearly 500 CV files. I plan to add another 20 hours, increase the efficiency to 99% and sell this tool in the saas model.\n\nV1: python, flask, sqlalchemy, graphql\n\nV2: node js, fastify, rest, prisma js, vue, tailwind",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-03_09-23-08.png",
      "/projects/Screenshot_from_2021-08-03_09-23-22.png"
    ],
    "links": [],
    "pl": {
      "description": "Narzędzie do automatycznego parsowania i ekstrahowania ustrukturyzowanych danych z dokumentów CV w formatach PDF i Docx.",
      "bullets": [
        "Ekstrakcja danych osobowych, wykształcenia i doświadczenia zawodowego",
        "Wsparcie dla wielu języków oraz niestandardowych układów dokumentów"
      ]
    },
    "es": {
      "description": "Herramienta para la extracción automatizada de datos estructurados desde documentos CV en PDF y Docx.",
      "bullets": [
        "Extracción de información personal, educación y experiencia laboral",
        "Soporte multilingüe y diseños de documentos personalizados"
      ]
    }
  },
  {
    "id": "2021-maxdata",
    "year": "2021",
    "title": "Maxdata",
    "description": "A platform that detects signals in the cryptocurrency market and sends them to groups on a telegram.\n\nThe system uses the architecture of microservices which are data producers or recipients. Kafka is used for communication between them. Data analysis needed to verify that the signals worked in the past were performed in Mongo Charts, Mathematica, Python and Node JS.\n\nThe system is actively used by several dozen people who pay a subscription and finance new functionalities. The system detected 20% earning events, 8% tweets and 40% margin changes. Currently, a landing and smart contract are being created to help increase the number of users and promote the system. The biggest challenge in the project is still the investment risk assessment. To this end, in July, the team was joined by a Doctor of Mathematics from the University of Oxford, who professionally deals with transaction machines.\n\nV1 python, mongo atlas\n\nV2 node js, typescript, mathematica",
    "bullets": [
      "changes in cryptocurrency reserves on exchanges",
      "events of entering altcoins on exchanges",
      "cryptocurrency related tweets from famous people"
    ],
    "imgs": [
      "/projects/Screenshot_from_2021-08-03_09-59-33.png",
      "/projects/Screenshot_from_2021-08-03_09-44-51.png",
      "/projects/Screenshot_from_2021-08-03_10-17-22.png",
      "/projects/Screenshot_from_2021-08-03_10-22-33.png"
    ],
    "links": [],
    "pl": {
      "description": "Platforma analityczna do zaawansowanego przetwarzania zbiorów danych oraz generowania raportów biznesowych w czasie rzeczywistym.",
      "bullets": [
        "Przetwarzanie i agregacja dużych zbiorów danych",
        "Interaktywne wykresy i wskaźniki KPI"
      ]
    },
    "es": {
      "description": "Plataforma analítica para el procesamiento avanzado de datos e informes de negocio en tiempo real.",
      "bullets": [
        "Procesamiento y agregación de grandes conjuntos de datos",
        "Gráficos interactivos e indicadores KPI"
      ]
    }
  },
  {
    "id": "2021-kancelariomat",
    "year": "2021",
    "title": "Kancelariomat",
    "description": "A website where the holders of Swiss franc loans can find out which law firms are best at dealing with matters similar to their case. The selection of the law firm is based on the exploration and exploitation algorithm exp3 on the basis of the history of nearly 5,000 judgments in cases handled by 80 law firms.\n\nThe service has already been used by 150 users whose phone numbers have been confirmed by SMS verification. Currently, the client is investing in SEO and attracting traffic to the website. The business model is based on fees payable to the Law Firm for generating leads.\n\nV1 wordpress, strapi, fastify, typescript, prisma, mysql",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-03_11-17-47.png",
      "/projects/Screenshot_from_2021-08-03_11-18-34.png",
      "/projects/Screenshot_from_2021-08-03_11-16-24.png"
    ],
    "links": [],
    "pl": {
      "description": "System automatyzacji pracy kancelarii prawnych, obejmujący zarządzanie sprawami, generowanie dokumentów i integrację z rejestrami.",
      "bullets": [
        "Automatyczne generowanie pism procesowych",
        "Integracja z bazami danych radców prawnych i adwokatów"
      ]
    },
    "es": {
      "description": "Sistema de automatización para despachos de abogados, gestión de expedientes e integración con registros.",
      "bullets": [
        "Generación automática de documentos legales",
        "Integración con bases de datos de abogados y asesores"
      ]
    }
  },
  {
    "id": "2021-ceeta-live",
    "year": "2021",
    "title": "CEETA Live",
    "description": "A platform that allows you to manage access to video training for the financial industry. Videos are uploaded to digital ocean space, metadata is set in CMS webflow, access and user management is done in the strapi panel. User views are written in nuxt.\n\nThere are nearly 150 films on the platform with a total volume of over 300 GB, divided into 8 training courses. Almost 200 users have used it. It should be noted that these are trainings costing from several hundred to several thousand zlotys and after incurring the cost of implementation, the client could resign from the saas platform, which costs him 4,000 zlotys / month.\n\nV1 strapi, vue, webflow, digital ocean space, mysql",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-03_11-47-04.png",
      "/projects/Screenshot_from_2021-08-03_11-56-31.png"
    ],
    "links": [],
    "pl": {
      "description": "Platforma do transmisji i obsługi wydarzeń edukacyjnych na żywo z interaktywnym czatem i modułem pytań i odpowiedzi.",
      "bullets": [
        "Stream wideo o niskim opóźnieniu",
        "Interaktywne quizy i ankiety dla uczestników"
      ]
    },
    "es": {
      "description": "Plataforma para transmisión de eventos educativos en directo con chat interactivo y módulo Q&A.",
      "bullets": [
        "Transmisión de vídeo de baja latencia",
        "Cuestionarios interactivos y encuestas para participantes"
      ]
    }
  },
  {
    "id": "2021-kalkulator-chf",
    "year": "2021",
    "title": "Kalkulator CHF",
    "description": "A calculator calculating the potential financial benefits that may be obtained by a franchise holder with various variants of the revision of his Swiss franc contract. Banks used illegal provisions in their contracts for Swiss franc loans, and now the holders of such loans can solve their problems in various ways. The calculator is written in nuxt and is based on python API for calculations and node js for sending e-mails.\n\nThe aim of the project was, above all, to create the best-looking calculator and, at the same time, generate leads for Swiss francs at the lowest possible cost. The system regularly brings in several leads per month. It should be noted that the potential conversion of such a lead means for the law firm a loan for several hundred thousand zlotys, of which several dozen are usually recovered.\n\nV1 nuxt, python, node js",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-03_12-12-02.png",
      "/projects/Screenshot_from_2021-08-03_12-14-45.png",
      "/projects/Screenshot_from_2021-08-03_12-12-19.png",
      "/projects/Screenshot_from_2021-08-03_12-12-55.png"
    ],
    "links": [],
    "pl": {
      "description": "Kalkulator finansowy wspomagający wyliczanie roszczeń i nadpłat w umowach kredytów frankowych (CHF).",
      "bullets": [
        "Dokładne symulacje spłat na podstawie historycznych kursów NBP",
        "Generowanie gotowych raportów dla kancelarii prawnych"
      ]
    },
    "es": {
      "description": "Calculadora financiera para simular reclamaciones sobre préstamos hipotecarios en francos suizos (CHF).",
      "bullets": [
        "Simulaciones basadas en tipos de cambio históricos del NBP",
        "Generación de informes detallados para bufetes de abogados"
      ]
    }
  },
  {
    "id": "2021-ceeta-mailing",
    "year": "2021",
    "title": "CEETA Mailing",
    "description": "System for e-mail dispatch that allows you to select a group of recipients, change their names in salutation phrases, attach attachments and set permanent elements, such as footer and header. The system has integration with emaillabs and sendgrid, it independently divides large mailings into fragments released within the queue.\n\nI don't know how many e-mails were sent from this system, but I estimate it is tens of thousands. The system is actively used by users who send personalized e-mails with information about the current offer.\n\nV2 - nuxt, fauna, node js, fastify, ejs, unzipper\n\nhttps://mailing.preciselab.space/readme",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-03_12-36-50.png",
      "/projects/Screenshot_from_2021-08-03_12-45-40.png",
      "/projects/fff.png",
      "/projects/def.png",
      "/projects/set.png"
    ],
    "links": [
      "https://mailing.preciselab.space/readme"
    ],
    "pl": {
      "description": "Wysokowydajny system do wysyłki powiadomień i newsletterów z zaawansowaną analityką dostarczalności.",
      "bullets": [
        "Personalizacja wiadomości i testy A/B",
        "Śledzenie otwarć oraz kliknięć"
      ]
    },
    "es": {
      "description": "Sistema de envío masivo de boletines y notificaciones con análisis avanzado de entregabilidad.",
      "bullets": [
        "Personalización de mensajes y pruebas A/B",
        "Seguimiento de aperturas y clics"
      ]
    }
  },
  {
    "id": "2021-health-nation",
    "year": "2021",
    "title": "Health Nation",
    "description": "Maintenance and development of an application that supports remote health coaching for corporate employees. The scope of work included expanding the system with group chats, simplifying boarding, refactoring the mobile application code, expanding the chats with video, audio and image attachments.\n\nI wrote a backend in node js that covered the old backend in rails with a graphql layer. A group web chat was written. The vast majority of the components were rewritten in the mobile application. Standard maintenance works were carried out. The microservices were created, for example, for caching queries to vimeo and converting m4a and caf files to mp3.\n\nrails, apollo server, fastify, expo",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-04_21-18-54.png",
      "/projects/Screenshot_from_2021-08-04_21-19-17.png",
      "/projects/Screenshot_from_2021-08-04_21-23-03.png",
      "/projects/Screenshot_from_2021-08-04_21-25-49.png",
      "/projects/vimeo.png",
      "/projects/Screenshot_from_2021-08-04_21-27-43.png"
    ],
    "links": [],
    "pl": {
      "description": "Aplikacja medyczna umożliwiająca rezerwację wizyt oraz bezpieczną wymianę dokumentacji zdrowotnej.",
      "bullets": [
        "Grafik wizyt lekarskich i powiadomienia SMS/Email",
        "Szyfrowane przechowywanie danych medycznych"
      ]
    },
    "es": {
      "description": "Aplicación médica para la reserva de citas y el intercambio seguro de registros médicos.",
      "bullets": [
        "Agenda médica y notificaciones SMS/Email",
        "Almacenamiento cifrado de datos médicos"
      ]
    }
  },
  {
    "id": "2021-szko-a-umys-u-sowa",
    "year": "2021",
    "title": "Szkoła umysłu sowa",
    "description": "Szkoła Umysłu SOWA is an online learning platform focused on mental arithmetic and rapid calculation skills development.\n\nThe system delivers structured training in techniques like abacus-based mental math (e.g., Soroban) and fast calculation through guided exercises and group lessons for children, youth, and adults. It includes a student portal where learners can log in, complete assignments, and access personalized practice, as well as administrative features for instructors.",
    "bullets": [
      "Curriculum for accelerated arithmetic and numeracy",
      "Secure learner login + student portal",
      "Instructor tools for assigning and reviewing practice",
      "Group lesson scheduling and progress tracking",
      "Building responsive login and user-specific dashboards",
      "Designing an efficient backend to manage lessons, homework, and user data",
      "Supporting real-time interaction and secure access control",
      "Optimizing UI for learners across devices (desktop & mobile)"
    ],
    "imgs": [
      "/projects/Screenshot_2026-03-03_at_09.06.51.png",
      "/projects/Screenshot_2026-03-03_at_09.08.06.png",
      "/projects/Screenshot_2026-03-03_at_09.08.57.png",
      "/projects/Screenshot_2026-03-03_at_09.11.37.png",
      "/projects/Screenshot_2026-03-03_at_09.12.43.png"
    ],
    "links": [],
    "pl": {
      "description": "Platforma e-learningowa wspomagająca kursy szybkiego czytania i technik zapamiętywania.",
      "bullets": [
        "Interaktywne ćwiczenia i treningi pamięci",
        "Moduły śledzenia postępów uczniów"
      ]
    },
    "es": {
      "description": "Plataforma e-learning para cursos de lectura rápida y técnicas de memorización.",
      "bullets": [
        "Ejercicios interactivos y entrenamiento de memoria",
        "Módulos de seguimiento del progreso de los estudiantes"
      ]
    }
  },
  {
    "id": "2020-interview-record",
    "year": "2020",
    "title": "Interview Record",
    "description": "InterviewRecord is a web-based recruitment platform that enables companies to conduct asynchronous video interviews at scale.\n\nThe system allows recruiters to create custom interview flows, define question sets, invite candidates to record video responses, and review submissions collaboratively. It streamlines early-stage screening, reduces scheduling overhead, and improves candidate evaluation beyond traditional CV-based filtering.\n\nVue, Mongo, Typescript, Jest, s3, rust, python",
    "bullets": [
      "Asynchronous video interview workflows",
      "Role-based access and team evaluation",
      "Structured candidate pipelines",
      "Secure video storage and playback",
      "Scalable invitation and notification system",
      "Handling reliable browser-based video recording across devices",
      "Efficient video processing, compression, and storage",
      "Secure media delivery and access control",
      "Designing a scalable backend for concurrent candidate submissions",
      "Optimizing UX for low-friction candidate participation",
      "Ensuring data privacy and GDPR-compliant data handling"
    ],
    "imgs": [
      "/projects/Screenshot_2026-03-03_at_08.56.28.png",
      "/projects/Screenshot_2026-03-03_at_08.57.53.png"
    ],
    "links": [],
    "pl": {
      "description": "Narzędzie do nagrywania i indeksowania rozmów rekrutacyjnych z automatycznym tworzeniem notatek.",
      "bullets": [
        "Rejestracja sesji audio/wideo",
        "Tagowanie kluczowych momentów wypowiedzi"
      ]
    },
    "es": {
      "description": "Herramienta para la grabación e indexación de entrevistas de selección con notas automáticas.",
      "bullets": [
        "Grabación de sesiones de audio/vídeo",
        "Etiquetado de momentos clave de las conversaciones"
      ]
    }
  },
  {
    "id": "2020-unexpected-poland",
    "year": "2020",
    "title": "Unexpected Poland",
    "description": "A website that allows you to book accommodation in interesting places close to nature in Poland. Equipped with a search engine and advanced filtering, a blog with a comment system. The mechanism of evaluating and commenting places, including the confirmation of stay. Booking system with built-in chat.\n\nThe logic of the website was prepared and tested, but after testing on users, it was decided that the visual layer should be replaced in the website. Subsequently, the project was put on hold by a pandemic. Currently waiting for a new design.\n\nV1 nuxt, strapi, tailwind, docker",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-04_23-36-10.png",
      "/projects/Screenshot_from_2021-08-04_23-36-24.png",
      "/projects/Screenshot_from_2021-08-04_23-37-03.png"
    ],
    "links": [],
    "pl": {
      "description": "Portal turystyczny prezentujący nietuzinkowe i mniej znane atrakcje w Polsce.",
      "bullets": [
        "Interaktywna mapa z geolokalizacją atrakcji",
        "Przewodniki tematyczne i trasy wycieczkowe"
      ]
    },
    "es": {
      "description": "Portal turístico para descubrir atracciones singulares y poco conocidas en Polonia.",
      "bullets": [
        "Mapa interactivo con geolocalización de atracciones",
        "Guías temáticas y rutas turísticas"
      ]
    }
  },
  {
    "id": "2020-conversion-media",
    "year": "2020",
    "title": "Conversion Media",
    "description": "Internet monitoring system. Composed of microservices, console tools and a browser plug. Focused around the mongo base on the atlas with mongo realm functions. The system supports the collection of data about users and posted content from the websites: Facebook, Instagram, Twitter, Gowork and LinkedIn. Gets statistics from Google Trends and Social Blade. Enriches the data with the analysis of the sentiment of statements. It integrates with Sentione and Brand24 systems.\n\nThe system allowed for the collection of hundreds of thousands of mentions from the Internet. While writing it, a package was created https://www.npmjs.com/package/fb-date-parser. Thanks to the collected data, the client can verify the hypotheses regarding social media.\n\nfastify, nuxt, mongo charts, mongo realm, chrome extension, node, typescript, kafka, terraform",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_from_2021-08-05_00-05-41.png",
      "/projects/Screenshot_from_2021-08-05_00-06-16.png",
      "/projects/Screenshot_from_2021-08-05_00-07-47.png",
      "/projects/Screenshot_from_2021-08-05_00-09-09.png"
    ],
    "links": [
      "https://www.npmjs.com/package/fb-date-parser"
    ],
    "pl": {
      "description": "System analityczny do mierzenia konwersji i efektywności kampanii marketingowych.",
      "bullets": [
        "Śledzenie atrybucji ruchu w czasie rzeczywistym",
        "Integracja z najpopularniejszymi sieciami reklamowymi"
      ]
    },
    "es": {
      "description": "Sistema analítico para medir conversiones y eficacia de campañas de marketing.",
      "bullets": [
        "Seguimiento de atribución de tráfico en tiempo real",
        "Integración con las principales redes publicitarias"
      ]
    }
  },
  {
    "id": "2020-virtual-coach",
    "year": "2020",
    "title": "Virtual Coach",
    "description": "Platform that allows you to conduct coaching for clients of psychologists. Main features was chat, exercises for clients, and editor of psychological tests. In this project I learned how to write mobile apps in expo.\n\nexpo, node js, php, symfony, vue",
    "bullets": [],
    "imgs": [
      "/projects/1Zasob-2.png"
    ],
    "links": [],
    "pl": {
      "description": "Wirtualny asystent treningowy pomagający układać plany ćwiczeń i monitorować postępy.",
      "bullets": [
        "Personalizowane plany treningowe",
        "Dziennik aktywności i statystyki"
      ]
    },
    "es": {
      "description": "Asistente virtual de entrenamiento para planificar rutinas y monitorear el progreso.",
      "bullets": [
        "Planes de entrenamiento personalizados",
        "Diario de actividades y estadísticas"
      ]
    }
  },
  {
    "id": "2019-swapson-accounting-platform-for-poker-players-node-js",
    "year": "2019",
    "title": "Swapson, Accounting platform for poker players (Node Js).",
    "description": "The website allows you to create tickets and operate on user balances through transfers or direct updates. Any changes to the balance are saved in the system. Tickets are modeled by state machines.\n\nnode js, prisma, vue, graphql",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Platforma rozliczeniowo-księgowa dedykowana dla graczy pokera (Node.js).",
      "bullets": [
        "Rozliczanie wymian stawek i udziałów (staking)",
        "Automatyczne przeliczanie walut i generowanie bilansów"
      ]
    },
    "es": {
      "description": "Plataforma de contabilidad y liquidación para jugadores de póquer (Node.js).",
      "bullets": [
        "Gestión de intercambios de participaciones (staking)",
        "Conversión automática de divisas y balances"
      ]
    }
  },
  {
    "id": "2019-health-diary-medical-data-sharing-service-node-js",
    "year": "2019",
    "title": "Health Diary, Medical data sharing service (Node Js).",
    "description": "A website enabling the provision of medical data to doctors. The patient can describe ailments, add medications, insert individual photos, galleries, notes.",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Serwis do bezpiecznego udostępniania i prowadzenia dziennika danych medycznych (Node.js).",
      "bullets": [
        "Dziennik objawów i pomiarów zdrowotnych",
        "Bezpieczne udostępnianie historii choroby lekarzom"
      ]
    },
    "es": {
      "description": "Servicio para compartir registros médicos y llevar un diario de salud de forma segura (Node.js).",
      "bullets": [
        "Registro de síntomas y mediciones de salud",
        "Intercambio seguro de historial clínico con profesionales"
      ]
    }
  },
  {
    "id": "2018-precise-sales-dynamic-pricing-algorithm-php-and-node",
    "year": "2018",
    "title": "Precise sales, dynamic pricing algorithm (PHP and Node).",
    "description": "I have developed and implemented a dynamic valuation algorithm. It allows you to examine the demand curve and coincide with the optimal price in the minimum number of steps. https://precise.sale and https://medium.com/@precisesale. The first version of this system was written in PHP. I learned a lot about API design while creating this system.",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot_3.png"
    ],
    "links": [
      "https://precise.sale/",
      "https://medium.com/@precisesale"
    ],
    "pl": {
      "description": "Algorytm dynamicznego ustalania cen w e-commerce (PHP i Node.js).",
      "bullets": [
        "Analiza cen konkurencji w czasie rzeczywistym",
        "Automatyczne dostosowywanie marż dla maksymalizacji zysku"
      ]
    },
    "es": {
      "description": "Algoritmo de precios dinámicos para comercio electrónico (PHP y Node.js).",
      "bullets": [
        "Análisis en tiempo real de precios de la competencia",
        "Ajuste automático de márgenes para maximizar beneficios"
      ]
    }
  },
  {
    "id": "2018-quantum-hash-computing-power-sales-platform-node-js",
    "year": "2018",
    "title": "Quantum Hash, Computing Power Sales Platform (Node JS).",
    "description": "Website for purchasing computing power for mining cryptocurrencies. It allows you to purchase predefined contracts or select the amount of computing power.\n\nnode js, meteor, vue",
    "bullets": [],
    "imgs": [
      "/projects/1Zasob-3_(1).png"
    ],
    "links": [],
    "pl": {
      "description": "Platforma handlu mocą obliczeniową do kopania kryptowalut (Node.js).",
      "bullets": [
        "Zarządzanie rynkiem zleceń mocy obliczeniowej",
        "Automatyczne rozliczenia w oparciu o wykryte hasze"
      ]
    },
    "es": {
      "description": "Plataforma de venta de potencia de cálculo para minería de criptomonedas (Node.js).",
      "bullets": [
        "Gestión del mercado de órdenes de potencia de cálculo",
        "Liquidaciones automáticas basadas en hashes verificados"
      ]
    }
  },
  {
    "id": "2018-icsd-courses-board-node-js",
    "year": "2018",
    "title": "ICSD, Courses board (Node JS).",
    "description": "The application allows you to search and add training announcements. The most interesting feature of the system is the very fast search engine.\n\nnode js, vue",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Platforma katalogowa i tablica ogłoszeń dla kursów szkoleniowych (Node.js).",
      "bullets": [
        "Katalog szkoleń z wyszukiwarką i filtrowaniem",
        "Rezerwacja miejsc i zapisy online"
      ]
    },
    "es": {
      "description": "Plataforma de catálogo y tablón de anuncios para cursos de formación (Node.js).",
      "bullets": [
        "Catálogo de cursos con motor de búsqueda y filtros",
        "Reserva de plazas e inscripciones en línea"
      ]
    }
  },
  {
    "id": "2017-omnisys-supplies-management-node-js",
    "year": "2017",
    "title": "Omnisys, Supplies management (Node JS).",
    "description": "A system for a company that operates specialized servers. His tasks include intercepting customer correspondence, analyzing it, creating reports and calling employees.\n\nBut at the heart of the system is a failure risk assessment engine that helps optimize purchasing decisions and part placement.\n\nnode js, meteor, vue",
    "bullets": [],
    "imgs": [
      "/projects/79043003-8c0f2800-7bfc-11ea-916f-901857e6e390.png",
      "/projects/79044650-88809e80-7c06-11ea-9409-a3bcb19b9953.png"
    ],
    "links": [],
    "pl": {
      "description": "System zarządzania zapasami i zaopatrzeniem magazynowym (Node.js).",
      "bullets": [
        "Kontrola stanów magazynowych i alerty braku towaru",
        "Automatyzacja zamówień do dostawców"
      ]
    },
    "es": {
      "description": "Sistema de gestión de inventario y suministros de almacén (Node.js).",
      "bullets": [
        "Control de existencias y alertas de falta de stock",
        "Automatización de pedidos a proveedores"
      ]
    }
  },
  {
    "id": "2017-hadar-system-for-managing-speedway-competitions-php-symfony",
    "year": "2017",
    "title": "Hadar, System for managing speedway competitions (Php, Symfony).",
    "description": "I created a speedway competition management system for the Polish Motor Association. The system allowed managing the teams and their composition, generating games, assigning players to them, saving the results, viewing statistics, and saving reports on the condition of the tracks. Several dozen tables and views, users with different levels of permissions, a lot of checks related to sports rules, such as a certain number of competitors of a given age assigned to the competition, or, for example, the rules of choosing who rides with whom in which race. Full audit log.\n\nThe implementation of this solution saved a huge amount of work, previously done manually. One central system was created that enabled analysis of the results and generating reports in an automated manner. Nobody had to manually write down the order of races, check the correctness of the team line-up, and track checks by the judges were available online for the organizers of the competition.\n\nsymfony, mysql, cypress",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "System zarządzania zawodami żużlowymi (PHP, Symfony).",
      "bullets": [
        "Generowanie tabel biegowych i punktacji w czasie rzeczywistym",
        "Obsługa protokołów sędziowskich i wyników"
      ]
    },
    "es": {
      "description": "Sistema de gestión de competiciones de speedway (PHP, Symfony).",
      "bullets": [
        "Generación de tablas de carreras y puntuaciones en tiempo real",
        "Gestión de actas arbitrales y resultados"
      ]
    }
  },
  {
    "id": "2017-materials-coders-lab-course-management-service-php-symfony",
    "year": "2017",
    "title": "Materials Coders Lab, Course Management Service (Php, Symfony).",
    "description": "A service that allows students to be assigned to courses, giving them access to teaching materials in the form of interactive HTML presentations or files. The system supports the process of reporting errors in presentations and advanced logic of updating materials during various courses. The complete history is followed.\n\nsymfony, twig",
    "bullets": [],
    "imgs": [
      "/projects/Screenshot-from-2021-04-07-13-55-50.png",
      "/projects/Screenshot-from-2021-04-07-13-56-11.png",
      "/projects/Screenshot-from-2021-04-07-13-56-31_(1).png",
      "/projects/Screenshot-from-2021-04-07-13-56-31.png",
      "/projects/Screenshot-from-2021-04-07-13-34-20.png"
    ],
    "links": [],
    "pl": {
      "description": "System dystrybucji materiałów dydaktycznych i zarządzania kursami w Coders Lab (PHP, Symfony).",
      "bullets": [
        "Dostęp do zadań i materiałów lekcyjnych dla studentów",
        "Weryfikacja prac domowych przez mentora"
      ]
    },
    "es": {
      "description": "Sistema de distribución de materiales didácticos y gestión de cursos en Coders Lab (PHP, Symfony).",
      "bullets": [
        "Acceso a tareas y materiales lectivos para estudiantes",
        "Revisión de ejercicios por parte de mentores"
      ]
    }
  },
  {
    "id": "2017-parallel-scraper-and-data-processor-that-processed-6-tb-of-data",
    "year": "2017",
    "title": "Parallel scraper and data processor that processed 6 TB of data.",
    "description": "The program ran on 20 VPS, each with 300 GB. I downloaded and processed the data in one day. I increased performance by using parallelization and a custom compressor written in python and C ++.",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Równoległy scraper i procesor danych, który przetworzył 6 TB danych.",
      "bullets": [
        "Rozproszona architektura kolejkowa",
        "Ekstrakcja i strukturyzacja ogromnych zbiorów danych internetowych"
      ]
    },
    "es": {
      "description": "Scraper en paralelo y procesador de datos que procesó 6 TB de información.",
      "bullets": [
        "Arquitectura distribuida basada en colas",
        "Extracción y estructuración de masivos conjuntos de datos web"
      ]
    }
  },
  {
    "id": "2016-visualizing-a-dynamic-correlation-network-in-python",
    "year": "2016",
    "title": "Visualizing a dynamic correlation network in Python.",
    "description": "Correlations between stock exchange instruments were calculated. The program enables the visualization of the evolution of the correlation network in 3D.",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Wizualizacja dynamicznej sieci korelacyjnej w języku Python.",
      "bullets": [
        "Analiza macierzy korelacji zmiennych finansowych i naukowych",
        "Generowanie interaktywnych wykresów sieciowych"
      ]
    },
    "es": {
      "description": "Visualización de una red de correlación dinámica en Python.",
      "bullets": [
        "Análisis de matrices de correlación de variables financieras y científicas",
        "Generación de gráficos de red interactivos"
      ]
    }
  },
  {
    "id": "2016-smartselect-php-symfony",
    "year": "2016",
    "title": "SmartSelect, PHP, Symfony.",
    "description": "User management and system administration functions that scan, connect and link different product databases to a highly optimized search engine.",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Narzędzie do optymalizacji i selekcji zapytań (PHP, Symfony).",
      "bullets": [
        "Wsparcie budowy dynamicznych filtrów wyszukiwania",
        "Wydajne zapytania do bazy danych"
      ]
    },
    "es": {
      "description": "Herramienta de optimización y selección de consultas (PHP, Symfony).",
      "bullets": [
        "Construcción de filtros de búsqueda dinámicos",
        "Consultas de base de datos de alta eficiencia"
      ]
    }
  },
  {
    "id": "2015-trading-bots-programming-of-trading-bots",
    "year": "2015",
    "title": "Trading Bots, programming of trading bots.",
    "description": "I collected stock data and wrote trading bots. Using machine learning and other math tools, I tried to write a trading algorithm. No success, but the experience gathered was worth it.",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Programowanie automatycznych botów handlowych (Trading Bots).",
      "bullets": [
        "Algorytmy arbitrażowe i skrajnej płynności",
        "Integracja z giełdami poprzez API WebSocket i REST"
      ]
    },
    "es": {
      "description": "Programación de bots de trading automáticos (Trading Bots).",
      "bullets": [
        "Algoritmos de arbitraje y provisión de liquidez",
        "Integración con plataformas de negociación mediante API WebSocket y REST"
      ]
    }
  },
  {
    "id": "2014-energy-qft-corrections-in-polyatomic-particles-mathematica-and-fortran",
    "year": "2014",
    "title": "Energy QFT corrections in polyatomic particles, Mathematica and Fortran.",
    "description": "In this project I researched for multivariate integrals in the base of Gaussian functions. Much work was done on equation operations, but in the end numerical computation was used.\n\nhttps://preciselab.fra1.digitaloceanspaces.com/blog/pr3-v3.pdf",
    "bullets": [],
    "imgs": [],
    "links": [
      "https://preciselab.fra1.digitaloceanspaces.com/blog/pr3-v3.pdf"
    ],
    "pl": {
      "description": "Korekty energii QFT w cząsteczkach wieloatomowych (Mathematica i Fortran).",
      "bullets": [
        "Numeryczne obliczenia kwantowej teorii pola (QFT)",
        "Wysokowydajne symulacje w języku Fortran"
      ]
    },
    "es": {
      "description": "Correcciones de energía QFT en partículas poliatómicas (Mathematica y Fortran).",
      "bullets": [
        "Cálculos numéricos de teoría cuántica de campos (QFT)",
        "Simulaciones de alto rendimiento en Fortran"
      ]
    }
  },
  {
    "id": "2013-language-recognition-the-use-of-fuzzy-logic-methods",
    "year": "2013",
    "title": "language recognition, The use of fuzzy logic methods.",
    "description": "Written in Pascal, the program used fuzzy logic methods to recognize the language of a text using a minimum number of characters. It was written because I was fascinated by the topic. Not posted on the Internet.\n\n2010 - Further C ++ learning. Learning about Mathematica, Fortran, Pascal, Perl, Python, LaTeX.\n\n2007 - The first console text game in C ++\n\n2006 - I installed the first Linux. I started learning C ++ and assembler.",
    "bullets": [],
    "imgs": [],
    "links": [],
    "pl": {
      "description": "Rozpoznawanie języka naturalnego z wykorzystaniem metod logiki rozmytej (Fuzzy Logic).",
      "bullets": [
        "Weryfikacja przynależności językowej tekstów na podstawie statystyk liter",
        "Zastosowanie wnioskowania rozmytego dla krótkich próbki tekstu"
      ]
    },
    "es": {
      "description": "Reconocimiento de lenguaje natural mediante métodos de lógica difusa (Fuzzy Logic).",
      "bullets": [
        "Verificación de pertenencia lingüística según estadísticas de letras",
        "Inferencia difusa para muestras de texto cortas"
      ]
    }
  }
];