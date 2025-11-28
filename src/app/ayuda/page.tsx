"use client";
import Link from "next/link";
import {
  FaQuestionCircle,
  FaMapMarkedAlt,
  FaLayerGroup,
  FaSearch,
  FaDownload,
  FaArrowUp,
} from "react-icons/fa";
import { useEffect, useState, ReactNode } from "react";

// Definición de tipos
interface HelpSectionProps {
  icon: ReactNode;
  title: string;
  items: string[];
}

interface FAQItemProps {
  question: string;
  answer: string;
}

export default function HelpPage() {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Contenedor principal con scroll */}
      <div className="h-screen overflow-y-auto">
        {/* Contenido con padding y espacio para el footer */}
        <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              <FaQuestionCircle className="inline mr-3" />
              Centro de Ayuda
            </h1>
            <p className="text-xl text-gray-600">
              Encuentra respuestas rápidas sobre cómo usar la plataforma IDE.
            </p>
          </div>

          {/* Secciones de Ayuda */}
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            {helpSections.map((section, index) => (
              <HelpSection
                key={index}
                icon={section.icon}
                title={section.title}
                items={section.items}
              />
            ))}
          </div>

          {/* Preguntas Frecuentes */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-12">
            <h2 className="text-2xl font-bold mb-6 text-blue-600">
              ❓ Preguntas Frecuentes
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">
              📧 ¿Necesitas más ayuda?
            </h2>
            <Link
              href="/contacto"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Contáctanos
            </Link>
          </div>
        </div>
      </div>

      {/* Botón de scroll to top */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          aria-label="Volver arriba"
        >
          <FaArrowUp className="text-xl" />
        </button>
      )}
    </div>
  );
}

// Componente HelpSection con tipos explícitos
const HelpSection = ({ icon, title, items }: HelpSectionProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="flex items-center mb-4">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <ul className="space-y-2 text-gray-700">
      {items.map((item: string, i: number) => (
        <li key={i}>• {item}</li>
      ))}
    </ul>
  </div>
);

// Componente FAQItem con tipos explícitos
const FAQItem = ({ question, answer }: FAQItemProps) => (
  <div className="border-b pb-4">
    <h3 className="font-semibold text-lg">{question}</h3>
    <p className="text-gray-600 mt-1">{answer}</p>
  </div>
);

// Datos con tipos explícitos
const helpSections: HelpSectionProps[] = [
  {
    icon: <FaMapMarkedAlt className="text-blue-500 text-2xl mr-3" />,
    title: "Navegación en el Mapa",
    items: [
      "Zoom: Usa la rueda del mouse o los botones +/−",
      "Arrastrar: Haz clic y mueve el mapa",
      "Búsqueda: Usa el buscador para ubicar lugares",
    ],
  },
  {
    icon: <FaLayerGroup className="text-green-500 text-2xl mr-3" />,
    title: "Gestión de Capas",
    items: [
      "Activar/Desactivar: Selecciona capas en el panel lateral",
      "Transparencia: Ajusta la opacidad desde el menú",
      "Orden: Arrastra para cambiar prioridad",
    ],
  },
  {
    icon: <FaSearch className="text-purple-500 text-2xl mr-3" />,
    title: "Búsqueda de Datos",
    items: [
      "Por dirección: Escribe una ubicación",
      "Por coordenadas: Ingresa latitud y longitud",
      "Filtros: Usa criterios avanzados",
    ],
  },
  {
    icon: <FaDownload className="text-orange-500 text-2xl mr-3" />,
    title: "Descarga de Datos",
    items: [
      "Formato Shapefile: Ideal para GIS",
      "GeoJSON: Para desarrollo web",
      "CSV: Datos tabulares",
    ],
  },
];

const faqs: FAQItemProps[] = [
  {
    question: "¿Cómo restablezco la vista del mapa?",
    answer: 'Haz clic en el botón "Home" en los controles de navegación.',
  },
  {
    question: "¿Por qué no se cargan algunas capas?",
    answer: "Verifica tu conexión a Internet o contacta al administrador.",
  },
  {
    question: "¿Cómo puedo compartir mi vista actual del mapa?",
    answer:
      "Usa la herramienta de compartir en la barra de herramientas para generar un enlace.",
  },
  {
    question: "¿Dónde encuentro información sobre los datos?",
    answer: "Cada capa tiene un botón de información con metadatos detallados.",
  },
];
