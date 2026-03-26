import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Leaf, 
  History, 
  Library, 
  Home, 
  Search, 
  Droplets, 
  Sun, 
  Thermometer, 
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus,
  X,
  Info,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { identifyPlant, diagnoseDisease, getClimateAdvice, type PlantIdentification, type DiseaseDiagnosis } from './services/LocalPlantEngine';
import { useGeolocation } from './hooks/useGeolocation';
import { useWeather } from './hooks/useWeather';
import { cn } from './utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Tab = 'home' | 'scanner' | 'library' | 'history';
type ScanMode = 'identify' | 'diagnose';

interface HistoryItem {
  id: string;
  date: string;
  type: 'identification' | 'diagnosis';
  data: PlantIdentification | DiseaseDiagnosis;
  image: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [scanMode, setScanMode] = useState<ScanMode>('identify');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PlantIdentification | DiseaseDiagnosis | null>(null);
  const [climateAdvice, setClimateAdvice] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { location } = useGeolocation();
  const { weather } = useWeather(location?.lat, location?.lng);

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('plantcare_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('plantcare_history', JSON.stringify(history));
  }, [history]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Accès à la caméra refusé. Veuillez vérifier les permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        processImage(dataUrl);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setCapturedImage(dataUrl);
        processImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (image: string) => {
    setIsScanning(true);
    setScanResult(null);
    setClimateAdvice(null);
    
    try {
      if (scanMode === 'identify') {
        const result = await identifyPlant(image);
        setScanResult(result);
        
        // Add to history
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: 'identification',
          data: result,
          image: image
        };
        setHistory(prev => [newItem, ...prev]);

        // Get climate advice if location is available
        if (location) {
          const advice = await getClimateAdvice(`Lat: ${location.lat}, Lng: ${location.lng}`, result.name);
          setClimateAdvice(advice);
        }
      } else {
        const result = await diagnoseDisease(image);
        setScanResult(result);
        
        // Add to history
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: 'diagnosis',
          data: result,
          image: image
        };
        setHistory(prev => [newItem, ...prev]);
      }
    } catch (err) {
      console.error("Processing failed", err);
      alert("Une erreur est survenue lors de l'analyse.");
    } finally {
      setIsScanning(false);
      stopCamera();
    }
  };

  const renderHome = () => (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">PlantCare AI</h1>
          <p className="text-emerald-600 text-sm">Prenez soin de vos plantes</p>
        </div>
        <div className="bg-emerald-100 p-2 rounded-full">
          <Leaf className="text-emerald-600 w-6 h-6" />
        </div>
      </header>

      {/* Weather Widget */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1 text-emerald-100 text-sm mb-1">
              <MapPin size={14} />
              <span>{weather?.city || "Localisation..."}</span>
            </div>
            <div className="text-4xl font-bold">{weather?.temp ?? "--"}°C</div>
            <p className="text-emerald-100 capitalize">{weather?.description || "Chargement..."}</p>
          </div>
          <Sun size={48} className="text-yellow-300" />
        </div>
        <div className="mt-6 flex gap-4 text-sm text-emerald-50">
          <div className="flex items-center gap-1">
            <Droplets size={14} />
            <span>{weather?.humidity}% Humidité</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer size={14} />
            <span>Idéal pour planter</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => { setActiveTab('scanner'); setScanMode('identify'); }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex flex-col items-center gap-2 hover:bg-emerald-50 transition-colors"
        >
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Search className="text-emerald-600" />
          </div>
          <span className="font-medium text-emerald-900">Identifier</span>
        </button>
        <button 
          onClick={() => { setActiveTab('scanner'); setScanMode('diagnose'); }}
          className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex flex-col items-center gap-2 hover:bg-emerald-50 transition-colors"
        >
          <div className="bg-red-100 p-3 rounded-xl">
            <AlertTriangle className="text-red-600" />
          </div>
          <span className="font-medium text-emerald-900">Diagnostiquer</span>
        </button>
      </div>

      {/* Recent History Preview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-emerald-900">Analyses récentes</h2>
          <button onClick={() => setActiveTab('history')} className="text-emerald-600 text-sm font-medium">Voir tout</button>
        </div>
        <div className="space-y-3">
          {history.slice(0, 3).map((item) => (
            <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-50 flex items-center gap-3">
              <img src={item.image} alt="Scan" className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-emerald-900 truncate">
                  {item.type === 'identification' 
                    ? (item.data as PlantIdentification).name 
                    : (item.data as DiseaseDiagnosis).diseaseName}
                </h3>
                <p className="text-xs text-emerald-500">
                  {format(new Date(item.date), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <ChevronRight className="text-emerald-300" size={20} />
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-8 text-emerald-400">
              <History size={48} className="mx-auto mb-2 opacity-20" />
              <p>Aucun historique pour le moment</p>
            </div>
          )}
        </div>
      </section>

      <footer className="text-center text-xs text-emerald-400 pt-4">
        Programmation expert informatique : Ouaddah Nadir
      </footer>
    </div>
  );

  const renderScanner = () => (
    <div className="h-full flex flex-col bg-black relative">
      {!capturedImage ? (
        <>
          <div className="flex-1 relative overflow-hidden">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-white/50 rounded-3xl" />
            </div>
            
            <div className="absolute top-6 left-0 right-0 flex justify-center gap-4">
              <button 
                onClick={() => setScanMode('identify')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  scanMode === 'identify' ? "bg-emerald-500 text-white" : "bg-white/20 text-white backdrop-blur-md"
                )}
              >
                Identification
              </button>
              <button 
                onClick={() => setScanMode('diagnose')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  scanMode === 'diagnose' ? "bg-red-500 text-white" : "bg-white/20 text-white backdrop-blur-md"
                )}
              >
                Diagnostic
              </button>
            </div>
          </div>

          <div className="p-8 bg-black flex justify-between items-center">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <Library size={24} />
            </button>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white p-1"
            >
              <div className="w-full h-full rounded-full bg-white" />
            </button>
            <button 
              onClick={() => setActiveTab('home')}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
            >
              <X size={24} />
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload}
          />
        </>
      ) : (
        <div className="flex-1 bg-emerald-50 overflow-y-auto pb-24">
          <div className="relative h-64">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            <button 
              onClick={() => setCapturedImage(null)}
              className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white backdrop-blur-md"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 -mt-8 bg-emerald-50 rounded-t-[32px] relative">
            {isScanning ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-emerald-600 font-medium animate-pulse">Analyse en cours par l'IA...</p>
              </div>
            ) : scanResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {scanMode === 'identify' ? (
                  <>
                    <div>
                      <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <CheckCircle2 size={14} />
                        Plante identifiée
                      </div>
                      <h2 className="text-3xl font-bold text-emerald-900">{(scanResult as PlantIdentification).name}</h2>
                      <p className="text-emerald-600 italic">{(scanResult as PlantIdentification).scientificName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] text-emerald-400 uppercase font-bold">Famille</p>
                        <p className="text-sm font-medium text-emerald-900">{(scanResult as PlantIdentification).family}</p>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] text-emerald-400 uppercase font-bold">Type</p>
                        <p className="text-sm font-medium text-emerald-900">{(scanResult as PlantIdentification).type}</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                      <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                        <Info size={18} className="text-emerald-500" />
                        Description
                      </h3>
                      <p className="text-sm text-emerald-700 leading-relaxed">{(scanResult as PlantIdentification).description}</p>
                    </div>

                    {climateAdvice && (
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <MapPin size={18} className="text-blue-500" />
                          Analyse climatique
                        </h3>
                        <p className="text-sm text-blue-700 leading-relaxed">{climateAdvice}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                        <Calendar size={18} className="text-emerald-500" />
                        Guide de culture
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Droplets size={20} /></div>
                          <div>
                            <p className="font-bold text-sm text-emerald-900">Arrosage</p>
                            <p className="text-xs text-emerald-600">{(scanResult as PlantIdentification).careInstructions.watering}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                          <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600"><Sun size={20} /></div>
                          <div>
                            <p className="font-bold text-sm text-emerald-900">Exposition</p>
                            <p className="text-xs text-emerald-600">{(scanResult as PlantIdentification).careInstructions.sunlight}</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600"><Plus size={20} /></div>
                          <div>
                            <p className="font-bold text-sm text-emerald-900">Plantation & Propagation</p>
                            <p className="text-xs text-emerald-600">
                              Profondeur: {(scanResult as PlantIdentification).careInstructions.plantingDepth}
                              <br />
                              Méthode: {(scanResult as PlantIdentification).careInstructions.propagation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider mb-1">
                        <AlertTriangle size={14} />
                        Diagnostic maladie
                      </div>
                      <h2 className="text-3xl font-bold text-emerald-900">{(scanResult as DiseaseDiagnosis).diseaseName}</h2>
                      <div className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-bold mt-2",
                        (scanResult as DiseaseDiagnosis).severity === 'élevée' ? "bg-red-100 text-red-600" :
                        (scanResult as DiseaseDiagnosis).severity === 'moyenne' ? "bg-orange-100 text-orange-600" : "bg-yellow-100 text-yellow-600"
                      )}>
                        Gravité: {(scanResult as DiseaseDiagnosis).severity}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                        <h3 className="font-bold text-emerald-900 mb-1">Cause</h3>
                        <p className="text-sm text-emerald-700">{(scanResult as DiseaseDiagnosis).cause}</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                        <h3 className="font-bold text-emerald-900 mb-1">Symptômes</h3>
                        <p className="text-sm text-emerald-700">{(scanResult as DiseaseDiagnosis).symptoms}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-emerald-900">Traitements recommandés</h3>
                      <div className="space-y-3">
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                          <p className="font-bold text-emerald-900 text-sm mb-1">Traitement Biologique</p>
                          <p className="text-xs text-emerald-700">{(scanResult as DiseaseDiagnosis).treatments.biological}</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                          <p className="font-bold text-red-900 text-sm mb-1">Traitement Chimique</p>
                          <p className="text-xs text-red-700">{(scanResult as DiseaseDiagnosis).treatments.chemical}</p>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                          <p className="font-bold text-emerald-900 text-sm mb-1">Produit & Dosage</p>
                          <p className="text-xs text-emerald-700">
                            Produit: {(scanResult as DiseaseDiagnosis).treatments.recommendedProduct}
                            <br />
                            Dosage: {(scanResult as DiseaseDiagnosis).treatments.dosage}
                            <br />
                            Fréquence: {(scanResult as DiseaseDiagnosis).treatments.frequency}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                          <p className="font-bold text-blue-900 text-sm mb-1">Prévention</p>
                          <p className="text-xs text-blue-700">{(scanResult as DiseaseDiagnosis).treatments.prevention}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200"
                >
                  Nouvelle analyse
                </button>
              </motion.div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="p-6 space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-emerald-900">Historique</h1>
        <p className="text-emerald-600 text-sm">Vos analyses passées</p>
      </header>

      <div className="space-y-4">
        {history.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 space-y-3">
            <div className="flex items-center gap-3">
              <img src={item.image} alt="Scan" className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                    item.type === 'identification' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  )}>
                    {item.type}
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    {format(new Date(item.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
                <h3 className="font-bold text-emerald-900 mt-1">
                  {item.type === 'identification' 
                    ? (item.data as PlantIdentification).name 
                    : (item.data as DiseaseDiagnosis).diseaseName}
                </h3>
                <p className="text-xs text-emerald-500 line-clamp-1">
                  {item.type === 'identification' 
                    ? (item.data as PlantIdentification).scientificName 
                    : (item.data as DiseaseDiagnosis).cause}
                </p>
              </div>
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-center py-20 text-emerald-300">
            <History size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">Aucun historique</p>
            <p className="text-sm">Commencez par scanner une plante !</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="p-6 space-y-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold text-emerald-900">Bibliothèque</h1>
        <p className="text-emerald-600 text-sm">Guide des plantes communes</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={20} />
        <input 
          type="text" 
          placeholder="Rechercher une plante..." 
          className="w-full bg-white border border-emerald-100 rounded-2xl py-4 pl-12 pr-4 text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { name: "Tomate", type: "Légume", img: "https://picsum.photos/seed/tomato/300/300" },
          { name: "Basilic", type: "Herbe", img: "https://picsum.photos/seed/basil/300/300" },
          { name: "Rose", type: "Fleur", img: "https://picsum.photos/seed/rose/300/300" },
          { name: "Citronnier", type: "Arbre", img: "https://picsum.photos/seed/lemon/300/300" },
          { name: "Aloe Vera", type: "Succulente", img: "https://picsum.photos/seed/aloe/300/300" },
          { name: "Piment", type: "Légume", img: "https://picsum.photos/seed/pepper/300/300" },
        ].map((plant, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-emerald-50">
            <img src={plant.img} alt={plant.name} className="w-full h-32 object-cover" />
            <div className="p-3">
              <h3 className="font-bold text-emerald-900">{plant.name}</h3>
              <p className="text-xs text-emerald-500">{plant.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    if (activeTab === 'scanner') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  return (
    <div className="max-w-md mx-auto h-screen bg-emerald-50 flex flex-col font-sans overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'home' && renderHome()}
            {activeTab === 'scanner' && renderScanner()}
            {activeTab === 'library' && renderLibrary()}
            {activeTab === 'history' && renderHistory()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-emerald-100 px-6 py-3 flex justify-between items-center pb-8">
        <button 
          onClick={() => setActiveTab('home')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'home' ? "text-emerald-600" : "text-emerald-300")}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold">Accueil</span>
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'library' ? "text-emerald-600" : "text-emerald-300")}
        >
          <Library size={24} />
          <span className="text-[10px] font-bold">Bibliothèque</span>
        </button>
        <div className="relative -top-8">
          <button 
            onClick={() => setActiveTab('scanner')}
            className="bg-emerald-600 text-white p-4 rounded-full shadow-lg shadow-emerald-200 border-4 border-emerald-50"
          >
            <Camera size={28} />
          </button>
        </div>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex flex-col items-center gap-1", activeTab === 'history' ? "text-emerald-600" : "text-emerald-300")}
        >
          <History size={24} />
          <span className="text-[10px] font-bold">Historique</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-emerald-300">
          <Calendar size={24} />
          <span className="text-[10px] font-bold">Journal</span>
        </button>
      </nav>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
