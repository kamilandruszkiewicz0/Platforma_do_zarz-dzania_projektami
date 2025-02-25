import React, { useState } from 'react';
import projectImage from './Projekty.png';

function ProjectOverview() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const features = [
    { id: 1, title: "Zarządzanie zadaniami", description: "Organizuj zadania i śledź postępy efektywnie.", icon: "🔧" },
    { id: 2, title: "Współpraca zespołowa", description: "Komunikuj się i współpracuj z zespołem w czasie rzeczywistym.", icon: "🤝" },
    { id: 3, title: "Śledzenie czasu", description: "Monitoruj czas spędzony na zadaniach i zarządzaj terminami.", icon: "⏲️" },
    { id: 4, title: "Raportowanie", description: "Generuj szczegółowe raporty do analizy wyników projektu.", icon: "📈" },
    { id: 5, title: "Udostępnianie plików", description: "Wygodnie udostępniaj i zarządzaj plikami.", icon: "📁" },
    { id: 6, title: "Integracje", description: "Bezproblemowo łącz się z innymi narzędziami i platformami.", icon: "🔗" }
  ];

  const faqs = [
    { id: 1, question: "Jak zacząć?", answer: "Aby rozpocząć, zarejestruj się i utwórz nowy projekt. Następnie możesz zaprosić swój zespół i zacząć dodawać zadania." },
    { id: 2, question: "Czy mogę integrować się z innymi narzędziami?", answer: "Tak, nasza platforma obsługuje różne integracje z popularnymi narzędziami i usługami." },
    { id: 3, question: "Jak mogę śledzić czas?", answer: "Możesz śledzić czas, uruchamiając stoper w ramach każdego zadania lub ręcznie rejestrując przepracowane godziny." },
    { id: 4, question: "Czy istnieje aplikacja mobilna?", answer: "Obecnie obsługujemy tylko aplikację internetową. Jednak pracujemy nad wersją mobilną." },
    { id: 5, question: "Jak mogę skontaktować się z pomocą techniczną?", answer: "Możesz skontaktować się z naszym zespołem wsparcia za pomocą formularza kontaktowego na naszej stronie lub poprzez czat w aplikacji." },
    { id: 6, question: "Jaki jest model cenowy?", answer: "Oferujemy różne plany cenowe, w tym darmowy poziom z podstawowymi funkcjami oraz płatne plany premium z zaawansowanymi możliwościami." }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="project-overview">
      <p className="project-description">
      Organizuj swoją pracę i zarządzaj zespołem jak profesjonalista z Manageo – darmowym oprogramowaniem do zarządzania projektami, 
      które oferuje więcej możliwości, niż możesz sobie wyobrazić.
      </p>
      <div className="bordered-box">
        <img src={projectImage} alt="Project Management" className="project-image" />
      </div>
      <div className="features-grid">
        {features.map((feature) => (
          <div key={feature.id} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <div className="feature-content">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="faq-section">
        <h2 className="faq-title">Najczęściej zadawane pytania (FAQ)</h2>
        <div className="faq-list">
          {faqs.map((faq) => (
            <div key={faq.id} className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(faq.id)}>
                {faq.question}
                <span className={`faq-icon ${expandedFAQ === faq.id ? 'expanded' : ''}`}>▲</span>
              </button>
              {expandedFAQ === faq.id && <p className="faq-answer">{faq.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectOverview;
