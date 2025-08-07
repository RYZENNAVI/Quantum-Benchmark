
// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, Home, Upload, Database, Edit3, BarChart2, HelpCircle } from "lucide-react";

import QuantumCircuitBuilder from "@/pages/QuantumCircuitBuilder";
import UploadPage from "@/pages/UploadPage";
import BenchmarkOverview from "@/pages/BenchmarkOverview";
import EvaluationResult from "@/pages/EvaluationResult";
import TutorialModal from "@/components/TutorialModal";

// Left sidebar component
const Sidebar = ({ onShowTutorial }) => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`${collapsed ? 'w-[70px]' : 'w-[350px]'} min-h-screen bg-black border-r border-gray-800 transition-all duration-300 ease-in-out relative`}>
      {/* Top title area - adjust style to align with the right Visual Circuit Designer */}
      <div className="bg-black p-4 flex items-center justify-between border-b border-gray-800 shadow-sm h-16">
        <div className="flex items-center gap-2 overflow-hidden">
          <Search className="w-5 h-5 text-white flex-shrink-0" />
          {!collapsed && <span className="text-lg font-bold text-white whitespace-nowrap">QML Benchmark</span>}
        </div>
        <div
          className="p-1 hover:bg-gray-800 rounded-full cursor-pointer transition-colors"
          onClick={toggleSidebar}
        >
          {collapsed ?
            <ChevronRight className="w-5 h-5 text-white" /> :
            <ChevronLeft className="w-5 h-5 text-white" />
          }
        </div>
      </div>

      {/* QML Benchmark section */}
      <div className="p-2">
        <div className="text-xs font-medium text-gray-400 px-4 py-2 mb-1">
          {!collapsed && "QML BENCHMARK"}
        </div>
        <nav className="space-y-1">
          <Link to="/upload" className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md ${pathname === '/upload' ? 'bg-gray-800' : ''}`}>
            <Upload className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Upload</span>}
          </Link>
          <Link to="/benchmark" className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md ${pathname === '/benchmark' ? 'bg-gray-800' : ''}`}>
            <Database className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Benchmark-Komponenten</span>}
          </Link>
          <Link to="/results" className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md ${pathname === '/results' ? 'bg-gray-800' : ''}`}>
            <BarChart2 className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Ergebnisse</span>}
          </Link>
          <Link to="/visual-editor" className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md ${pathname === '/visual-editor' ? 'bg-gray-800' : ''}`}>
            <Edit3 className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Visual Editor</span>}
          </Link>
        </nav>
      </div>

      {/* Tutorial Button */}
      <div className="p-2">
        <button
          onClick={onShowTutorial}
          className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md w-full`}
        >
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Tutorial</span>}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 my-2 mx-3"></div>

      {/* Dashboard section */}
      {/*<div className="p-2">
        <div className="text-xs font-medium text-gray-400 px-4 py-2 mb-1">
          {!collapsed && "DASHBOARD"}
        </div>
        <nav className="space-y-1">
          {/*<Link to="/dashboard" className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-md ${pathname === '/dashboard' ? 'bg-gray-800' : ''}`}>
            <Home className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Dashboard</span>}
          </Link>
          
        </nav> 
      </div> */}
    </div>
  );
};

export default function App() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Check if user has seen tutorial on first visit
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('tutorialSeen');
    if (!tutorialSeen) {
      setShowTutorial(true);
    }
  }, []);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem('tutorialSeen', 'true');
  };

  const handleShowTutorial = () => {
    setShowTutorial(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      <Sidebar onShowTutorial={handleShowTutorial} />
      <main className="flex-1 p-6">
        <Routes>
          {/*<Route path="/dashboard" element={<QuantumEncoding />} />*/}
          <Route path="/upload" element={<UploadPage onShowTutorial={handleShowTutorial} />} />
          <Route path="/benchmark" element={<BenchmarkOverview onShowTutorial={handleShowTutorial} />} />
          <Route path="/visual-editor" element={<QuantumCircuitBuilder onShowTutorial={handleShowTutorial} />} />
          <Route path="/results" element={<EvaluationResult onShowTutorial={handleShowTutorial} />} />
          <Route path="/" element={<UploadPage onShowTutorial={handleShowTutorial} />} />
        </Routes>
      </main>
      
      <TutorialModal 
        isOpen={showTutorial} 
        onClose={() => setShowTutorial(false)}
        onComplete={handleTutorialComplete}
      />
    </div>
  );
}
