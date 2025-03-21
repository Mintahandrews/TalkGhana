import React, { useState, useEffect } from 'react';
import { Squircle, Database, Download, HardDrive, Loader, Trash2 } from 'lucide-react';
import { 
  getOfflineStorageStats, 
  clearAllCachedData, 
  deleteLanguageModel 
} from '../services/OfflineStorageService';
import { useLanguage, GhanaianLanguage } from '../context/LanguageContext';
import { useUserPreferences } from '../context/UserPreferencesContext';

// Helper to format bytes into readable sizes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const StorageManager: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { preferences } = useUserPreferences();
  const [stats, setStats] = useState({
    totalSize: 0,
    languageModelsSize: 0,
    cacheSize: 0,
    languageModels: [] as any[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [clearingLanguage, setClearingLanguage] = useState<GhanaianLanguage | null>(null);
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const storageStats = await getOfflineStorageStats();
      setStats(storageStats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all offline data? This cannot be undone.')) {
      setIsClearing(true);
      try {
        await clearAllCachedData();
        await loadStats();
      } catch (error) {
        console.error('Failed to clear data:', error);
      } finally {
        setIsClearing(false);
      }
    }
  };
  
  const handleDeleteLanguageModel = async (language: GhanaianLanguage) => {
    setClearingLanguage(language);
    try {
      await deleteLanguageModel(language);
      await loadStats();
    } catch (error) {
      console.error(`Failed to delete ${language} model:`, error);
    } finally {
      setClearingLanguage(null);
    }
  };
  
  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${
      preferences.highContrast ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="px-4 py-3 bg-blue-500 text-white">
        <h2 className="text-lg font-medium flex items-center">
          <Database size={20} className="mr-2" />
          {t('storageManagement')}
        </h2>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader className="animate-spin text-blue-500" size={24} />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">{t('dataUsage')}</h3>
              <div className={`p-3 rounded-lg ${
                preferences.highContrast ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t('storageManagement')}</span>
                  <span className="text-sm font-medium">{formatBytes(stats.totalSize)}</span>
                </div>
                
                <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full"
                    style={{ width: `${Math.min(100, (stats.totalSize / (100 * 1024 * 1024)) * 100)}%` }}
                  />
                </div>
                
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                    {t('languageSettings')}: {formatBytes(stats.languageModelsSize)}
                  </div>
                  <div>
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                    Cache: {formatBytes(stats.cacheSize)}
                  </div>
                </div>
              </div>
            </div>
            
            {stats.languageModels.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Downloaded Languages</h3>
                <div className="space-y-2">
                  {stats.languageModels.map((model) => (
                    <div 
                      key={model.language}
                      className={`p-3 rounded-lg ${
                        preferences.highContrast ? 'bg-gray-700' : 'bg-gray-100'
                      } flex justify-between items-center`}
                    >
                      <div>
                        <div className="font-medium capitalize">
                          {model.language}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatBytes(model.size)} • Last updated: {new Date(model.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLanguageModel(model.language)}
                        disabled={clearingLanguage === model.language || model.language === currentLanguage}
                        className={`p-2 rounded-lg ${
                          clearingLanguage === model.language
                            ? 'bg-gray-300 text-gray-500'
                            : model.language === currentLanguage
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : preferences.highContrast
                            ? 'bg-red-800 text-white hover:bg-red-700'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title={model.language === currentLanguage ? "Can't delete current language" : "Delete language data"}
                      >
                        {clearingLanguage === model.language ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`mb-4 p-4 rounded-lg flex items-center ${
                preferences.highContrast ? 'bg-yellow-800 text-yellow-100' : 'bg-yellow-50 text-yellow-800'
              }`}>
                <Squircle size={20} className="mr-2 text-yellow-500" />
                <p className="text-sm">No language models downloaded. Download language data from the Settings screen for offline use.</p>
              </div>
            )}
            
            <button
              onClick={handleClearAllData}
              disabled={isClearing || stats.totalSize === 0}
              className={`w-full py-2 rounded-lg flex items-center justify-center ${
                isClearing || stats.totalSize === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : preferences.highContrast
                  ? 'bg-red-800 text-white hover:bg-red-700'
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {isClearing ? (
                <>
                  <Loader size={16} className="animate-spin mr-2" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 size={16} className="mr-2" />
                  {t('clearCache')}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default StorageManager;
