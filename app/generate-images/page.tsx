'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  PhotoIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface GeneratedImage {
  id: number;
  mimeType: string;
  base64: string;
  dataUrl: string;
  enhancedPrompt: string | null;
}

interface GenerationResponse {
  images: GeneratedImage[];
  count: number;
  model: string;
  prompt: string;
  metadata: {
    projectId: string;
    region: string;
    aspectRatio: string;
    sampleCount: number;
    addWatermark: boolean;
  };
}

export default function GenerateImagesPage() {
  const [prompt, setPrompt] = useState('');
  const [projectId, setProjectId] = useState('');
  const [region, setRegion] = useState('us-central1');
  const [model, setModel] = useState('imagen-4.0-generate-001');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [sampleCount, setSampleCount] = useState(1);
  const [addWatermark, setAddWatermark] = useState(true);
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<GenerationResponse | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  // Cargar configuración guardada desde localStorage
  useEffect(() => {
    const savedProjectId = localStorage.getItem('google_cloud_project_id');
    const savedRegion = localStorage.getItem('google_cloud_region');
    const savedApiKey = localStorage.getItem('google_access_token');
    
    if (savedProjectId) setProjectId(savedProjectId);
    if (savedRegion) setRegion(savedRegion);
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setShowApiKey(false);
    }
  }, []);

  const generateImages = async () => {
    if (!prompt.trim()) {
      setError('Por favor ingresa un prompt para generar la imagen');
      return;
    }

    if (!projectId.trim()) {
      setError('Por favor ingresa el Google Cloud Project ID');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);
    setLastResponse(null);

    try {
      // Guardar configuración en localStorage
      if (projectId) localStorage.setItem('google_cloud_project_id', projectId);
      if (region) localStorage.setItem('google_cloud_region', region);
      if (apiKey) localStorage.setItem('google_access_token', apiKey);

      const response = await fetch('/api/generate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          projectId,
          region,
          model,
          aspectRatio,
          sampleCount,
          addWatermark,
          enhancePrompt,
          apiKey: apiKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar imágenes');
      }

      setGeneratedImages(data.images || []);
      setLastResponse(data);
    } catch (err) {
      console.error('Error generating images:', err);
      setError(err instanceof Error ? err.message : 'Error al generar imágenes');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = `imagen-${image.id}-${Date.now()}.${image.mimeType.split('/')[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const aspectRatioOptions = [
    { value: '1:1', label: '1:1 (Cuadrado)' },
    { value: '3:4', label: '3:4 (Vertical)' },
    { value: '4:3', label: '4:3 (Horizontal)' },
    { value: '16:9', label: '16:9 (Panorámico)' },
    { value: '9:16', label: '9:16 (Retrato)' },
  ];

  const modelOptions = [
    { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 (Estándar)' },
    { value: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast (Rápido)' },
    { value: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4.0 Ultra (Máxima calidad)' },
    { value: 'imagen-3.0-generate-002', label: 'Imagen 3.0 (Legacy)' },
  ];

  const regionOptions = [
    { value: 'us-central1', label: 'us-central1 (Iowa)' },
    { value: 'us-east1', label: 'us-east1 (Carolina del Sur)' },
    { value: 'us-west1', label: 'us-west1 (Oregón)' },
    { value: 'europe-west1', label: 'europe-west1 (Bélgica)' },
    { value: 'europe-west4', label: 'europe-west4 (Países Bajos)' },
    { value: 'asia-east1', label: 'asia-east1 (Taiwán)' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <Link 
            href="/home"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <PhotoIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Generar Imágenes con IA
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Crea imágenes increíbles usando Google Imagen (Vertex AI)
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de configuración */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Cog6ToothIcon className="w-6 h-6" />
                Configuración
              </h2>

              <div className="space-y-6">
                {/* Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción de la imagen *
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ejemplo: Un gato leyendo un periódico en un café parisino, estilo acuarela"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {prompt.length}/500 caracteres
                  </p>
                </div>

                {/* Google Cloud Project ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Google Cloud Project ID *
                  </label>
                  <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="mi-proyecto-123"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Región */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Región
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {regionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Access Token */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Token (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="ya29..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showApiKey ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Si no se proporciona, se usará Application Default Credentials
                  </p>
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Modelo
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    {aspectRatioOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número de imágenes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de imágenes: {sampleCount}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={sampleCount}
                    onChange={(e) => setSampleCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>1</span>
                    <span>4</span>
                  </div>
                </div>

                {/* Opciones avanzadas */}
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Agregar Watermark
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Watermark digital invisible
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddWatermark(!addWatermark)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        addWatermark ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          addWatermark ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mejorar Prompt
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mejorar automáticamente el prompt
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnhancePrompt(!enhancePrompt)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        enhancePrompt ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enhancePrompt ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Botón de generar */}
                <button
                  onClick={generateImages}
                  disabled={isGenerating || !prompt.trim() || !projectId.trim()}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Generar Imágenes
                    </>
                  )}
                </button>

                {/* Mensaje de error */}
                {error && (
                  <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        Error
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Información */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Nota:</strong> Para usar este servicio necesitas:
                    <br />• Un proyecto de Google Cloud
                    <br />• Vertex AI API habilitada
                    <br />• Facturación activada
                    <br />• Autenticación configurada
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de resultados */}
          <div className="lg:col-span-2">
            {isGenerating && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">
                  Generando imágenes... Esto puede tomar unos momentos.
                </p>
              </div>
            )}

            {!isGenerating && generatedImages.length === 0 && !error && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-gray-500 dark:text-gray-400">
                  Las imágenes generadas aparecerán aquí
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Completa el formulario y haz clic en "Generar Imágenes"
                </p>
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="space-y-6">
                {/* Información de la generación */}
                {lastResponse && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      Imágenes Generadas
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Modelo:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {lastResponse.model}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Aspect Ratio:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {lastResponse.metadata.aspectRatio}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Cantidad:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {lastResponse.count} imagen{lastResponse.count !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Watermark:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {lastResponse.metadata.addWatermark ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </div>
                    {lastResponse.prompt && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prompt original:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{lastResponse.prompt}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Grid de imágenes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((image) => (
                    <div
                      key={image.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                        <img
                          src={image.dataUrl}
                          alt={`Imagen generada ${image.id}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadImage(image);
                            }}
                            className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-md"
                            title="Descargar"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Imagen #{image.id}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {image.mimeType}
                          </span>
                        </div>
                        {image.enhancedPrompt && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                            Prompt mejorado: {image.enhancedPrompt}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de imagen ampliada */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Imagen #{selectedImage.id}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadImage(selectedImage)}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  title="Descargar"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-100px)]">
              <img
                src={selectedImage.dataUrl}
                alt={`Imagen generada ${selectedImage.id}`}
                className="w-full h-auto rounded-lg"
              />
              {selectedImage.enhancedPrompt && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prompt mejorado:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedImage.enhancedPrompt}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
