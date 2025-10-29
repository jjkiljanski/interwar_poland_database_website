import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'pl';

interface Translations {
  [key: string]: {
    en: string;
    pl: string;
  };
}

const translations: Translations = {
  // Welcome Page
  'welcome.title': {
    en: 'Economic Geography of Interwar Poland',
    pl: 'Geografia Ekonomiczna Międzywojennej Polski'
  },
  'welcome.subtitle': {
    en: 'District-level database of socio-economic data for interwar Poland (1918-1939)',
    pl: 'Baza danych społeczno-ekonomicznych dla II RP na poziomie powiatowym (1918-1939)'
  },
  'welcome.exploreButton': {
    en: 'Explore Datasets',
    pl: 'Przeglądaj Dane'
  },
  'welcome.aboutButton': {
    en: 'About Project',
    pl: 'Na temat projektu'
  },
  
  // Map Viewer
  'map.title': {
    en: 'Economic Geography of Interwar Poland',
    pl: 'Geografia Ekonomiczna Międzywojennej Polski'
  },
  'map.home': {
    en: 'Home',
    pl: 'Start'
  },
  'map.selectDataset': {
    en: 'Select Dataset',
    pl: 'Wybierz Zbiór'
  },
  'map.info': {
    en: 'Info',
    pl: 'Info'
  },
  'map.datasetInfo': {
    en: 'Dataset Info',
    pl: 'Info o Zbiorze'
  },
  'map.datasetVariant': {
    en: 'Dataset Variant',
    pl: 'Wariant Zbioru'
  },
  
  // Dataset Info Panel (custom)
  'info.tableHeader': {
    en: 'Source Data Table Metadata',
    pl: 'Metadane tabeli źródłowej'
  },
  'info.datasetHeader': {
    en: 'Dataset Metadata',
    pl: 'Metadane zbioru danych'
  },
  'info.datasetName': {
    en: 'Dataset',
    pl: 'Zbiór danych'
  },
  'info.completeness': {
    en: 'Dataset completeness',
    pl: 'Kompletność zbioru'
  },
  'info.countPresent': {
    en: 'Districts with data',
    pl: 'Dane dla powiatów'
  },
  'info.countMissing': {
    en: 'Districts without data',
    pl: 'Brak danych dla powiatów'
  },
  'info.completenessAfter': {
    en: 'Dataset completeness after imputation',
    pl: 'Kompletność zbioru po imputacji'
  },
  'info.countPresentAfter': {
    en: 'Districts with data after imputation',
    pl: 'Dane dla powiatów po imputacji'
  },
  'info.countMissingAfter': {
    en: 'Districts without data after imputation',
    pl: 'Brak danych dla powiatów po imputacji'
  },
  'info.source': {
    en: 'Source',
    pl: 'Źródło'
  },
  'info.pagePrefix': {
    en: 'p. ',
    pl: 'str. '
  },
  
  'info.tableLabel': { en: 'table', pl: 'tabela' },
  'info.description': {
    en: 'Description',
    pl: 'Opis'
  },
  'info.dataDate': {
    en: 'Data for date',
    pl: 'Dane dla daty'
  },
  'info.originalAdmin': {
    en: 'Original administrative boundaries',
    pl: 'Oryg. granice administracyjne'
  },
  'info.standardization': {
    en: 'Dataset standardization (comments)',
    pl: 'Standardyzacja zbioru (komentarz)'
  },
  
  'info.unit': { en: 'Unit', pl: 'Jednostka' },
  'info.none': {
    en: 'None',
    pl: 'Brak'
  },
  'map.noDataset': {
    en: 'No Dataset Selected',
    pl: 'Nie Wybrano Zbioru Danych'
  },
  'map.noDatasetDescription': {
    en: 'Click "Select Dataset" to choose a dataset from the hierarchical tree and visualize it on the map.',
    pl: 'Kliknij "Wybierz Zbiór", aby wybrać zbiór danych z hierarchicznego drzewa i zwizualizować go na mapie.'
  },
  'map.browseDatasets': {
    en: 'Browse Datasets',
    pl: 'Przeglądaj Zbiory'
  },
  'map.loading': {
    en: 'Loading dataset...',
    pl: 'Ładowanie zbioru danych...'
  },
  
  // Dataset Selector
  'selector.title': {
    en: 'Select Dataset',
    pl: 'Wybierz Zbiór Danych'
  },
  'selector.search': {
    en: 'Search datasets...',
    pl: 'Szukaj zbiorów...'
  },
  'selector.noResults': {
    en: 'No datasets found matching',
    pl: 'Nie znaleziono zbiorów pasujących do'
  },
  'selector.description': {
    en: 'Browse and select datasets from the hierarchical tree',
    pl: 'Przeglądaj i wybieraj zbiory z hierarchicznego drzewa'
  },
  
  // Metadata Panel
  'metadata.title': {
    en: 'Dataset Information',
    pl: 'Informacje o Zbiorze Danych'
  },
  'metadata.category': {
    en: 'Category',
    pl: 'Kategoria'
  },
  'metadata.date': {
    en: 'Date',
    pl: 'Data'
  },
  'metadata.description': {
    en: 'Description',
    pl: 'Opis'
  },
  'metadata.source': {
    en: 'Source',
    pl: 'Źródło'
  },
  'metadata.viewSource': {
    en: 'View Original Source',
    pl: 'Zobacz Oryginalne Źródło'
  },
  'metadata.unit': {
    en: 'Unit',
    pl: 'Jednostka'
  },
  'metadata.methodology': {
    en: 'Methodology',
    pl: 'Metodologia'
  },
  'metadata.notes': {
    en: 'Notes',
    pl: 'Uwagi'
  },
  
  // About Page
  'about.back': {
    en: 'Back to Home',
    pl: 'Powrót do Strony Głównej'
  },
  'about.title': {
    en: 'About the Economic Geography of Interwar Poland Database',
    pl: 'O bazie danych Geografia Ekonomiczna Międzywojennej Polski'
  },
  
  // Language Selector
  'language.select': {
    en: 'Language',
    pl: 'Język'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pl');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

