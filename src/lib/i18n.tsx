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
    en: 'Interwar Poland District Data Explorer',
    pl: 'Eksplorator Danych Powiatowych Międzywojennej Polski'
  },
  'welcome.subtitle': {
    en: 'Explore comprehensive district-level statistical data from Poland\'s interwar period (1918-1939)',
    pl: 'Przeglądaj kompleksowe dane statystyczne na poziomie powiatowym z okresu międzywojennego Polski (1918-1939)'
  },
  'welcome.exploreButton': {
    en: 'Explore Datasets',
    pl: 'Przeglądaj Zbiory Danych'
  },
  'welcome.aboutButton': {
    en: 'About Project',
    pl: 'O Projekcie'
  },
  
  // Map Viewer
  'map.title': {
    en: 'Interwar Poland Data Explorer',
    pl: 'Eksplorator Danych Międzywojennej Polski'
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
    en: 'About the Interwar Poland District Data Explorer',
    pl: 'O Eksploratorze Danych Powiatowych Międzywojennej Polski'
  },
  
  // Language Selector
  'language.select': {
    en: 'Language',
    pl: 'Język'
  },
  'language.en': {
    en: 'English',
    pl: 'Angielski'
  },
  'language.pl': {
    en: 'Polish',
    pl: 'Polski'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

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
