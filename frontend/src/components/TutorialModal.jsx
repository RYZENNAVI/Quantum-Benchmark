import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Upload, Database, BarChart2, Edit3 } from 'lucide-react';

const TutorialModal = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      title: "Willkommen bei QML Benchmark",
      content: "Dies ist eine Quantenmaschinenlern-Benchmark-Plattform, die Ihnen hilft, verschiedene Quantenkodierungsmethoden zu bewerten.",
      icon: <Play className="w-8 h-8 text-blue-500" />
    },
    {
      title: "Daten hochladen",
      content: "Auf der Upload-Seite können Sie Ihre Datensätze hochladen. Unterstützt werden verschiedene Formate wie CSV, JSON und andere. Klicken Sie auf 'Datei auswählen' um eine Datei zu laden, oder fügen Sie JSON-Code direkt in das Textfeld ein. Verwenden Sie 'Datei Hochladen' um die Validierung zu starten.",
      icon: <Upload className="w-8 h-8 text-green-500" />
    },
    {
      title: "Benchmark konfigurieren",
      content: "Auf der Benchmark-Komponenten-Seite können Sie Kodierungsmethoden, Datensätze und Parameter für Benchmark-Tests einstellen. Wählen Sie eine Kodierung, einen Datensatz und einen Ansatz aus. Klicken Sie auf 'Benchmark starten' um den Test zu beginnen. Die Ergebnisse werden automatisch verarbeitet.",
      icon: <Database className="w-8 h-8 text-purple-500" />
    },
    {
      title: "Visueller Schaltkreiseditor",
      content: "Im Visual Editor können Sie Quantengatter per Drag & Drop ziehen, um benutzerdefinierte Quantenschaltkreise zu erstellen. Ziehen Sie Gatter aus der Palette auf das Canvas. Klicken Sie auf ein Gatter um Parameter zu bearbeiten. Verwenden Sie 'Schaltkreis exportieren' um Ihre Arbeit zu speichern.",
      icon: <Edit3 className="w-8 h-8 text-orange-500" />
    },
    {
      title: "Ergebnisse anzeigen",
      content: "Auf der Ergebnisse-Seite können Sie Benchmark-Ergebnisse einsehen, einschließlich Leistungsmetriken und Vergleichsdiagrammen. Filtern Sie nach Datensatz, Ansatz oder Qubit-Anzahl. Exportieren Sie Daten als CSV. Vergleichen Sie verschiedene Kodierungsmethoden in interaktiven Charts.",
      icon: <BarChart2 className="w-8 h-8 text-red-500" />
    },
    {
      title: "Bereit zum Starten",
      content: "Sie haben jetzt alle grundlegenden Funktionen kennengelernt und können mit der Plattform beginnen! Nutzen Sie die verschiedenen Tools um Ihre Quantenmaschinenlern-Experimente durchzuführen.",
      icon: <Play className="w-8 h-8 text-blue-500" />
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Tutorial</h2>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            {tutorialSteps[currentStep].icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {tutorialSteps[currentStep].title}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {tutorialSteps[currentStep].content}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-center space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Zurück
          </button>

          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Überspringen
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {currentStep === tutorialSteps.length - 1 ? 'Fertig' : 'Weiter'}
            {currentStep < tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal; 