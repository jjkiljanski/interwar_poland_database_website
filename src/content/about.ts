export type AboutSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

export const aboutContent: Record<'en' | 'pl', { sections: AboutSection[] }> = {
  en: {
    sections: [
      {
        title: 'About the Interwar Poland District Data Explorer',
        paragraphs: [
          'This About page was generated with AI for demo version',
          'This project provides a comprehensive digital platform for exploring and visualizing district-level statistical data from Poland during the interwar period (1918–1939). Following the restoration of Polish independence after World War I, the Second Polish Republic faced the enormous challenge of rebuilding and modernizing its infrastructure, economy, and administrative systems.',
          'The data presented here offers insights into the geographic, demographic, and economic landscape of interwar Poland, drawing from historical statistical yearbooks, census data, and administrative records from the period.'
        ]
      },
      {
        title: 'Data Sources & Methodology',
        bullets: [
          'Polish Statistical Yearbooks (Rocznik Statystyczny)',
          'Census data from 1921 and 1931',
          'Administrative records from the Ministry of Internal Affairs',
          'Regional economic surveys and reports',
          'Infrastructure development documentation'
        ],
        paragraphs: [
          'All data has been digitized and georeferenced to historical district boundaries. Each dataset includes metadata documenting sources, collection dates, and methodological notes to ensure transparency and academic rigor.'
        ]
      },
      {
        title: 'Technical Implementation',
        bullets: [
          'DuckDB‑WASM: fast client‑side analytical queries on Parquet files',
          'GeoJSON: historical district boundaries for spatial visualization',
          'Interactive choropleth maps for district‑level indicators',
          'Hierarchical dataset taxonomy for discoverability'
        ]
      },
      {
        title: 'Historical Context',
        paragraphs: [
          'The interwar period was a time of significant transformation for Poland. After 123 years of partition, the newly independent nation faced the task of unifying territories that had been under different administrative systems (Russian, Prussian, and Austro‑Hungarian).',
          'This data reflects both the challenges and achievements of this era: the development of the port of Gdynia, industrialization efforts, educational expansion, infrastructure improvements, and the gradual modernization of Polish society and economy.'
        ]
      },
      {
        title: 'Acknowledgments',
        paragraphs: [
          'I would like to thank Dr. Marcin Wroński for the idea and his constant support during the construction of the database. I am also grateful to Professor Nikolaus Wolf for inspiring my fascination with economic history, his unparalleled lectures on the history of economics, and for supervising my master’s thesis as my advisor.',
          'I would like to thank Mikołaj Kiljański for digitizing the first versions of the detailed county maps of the Second Polish Republic. I am also grateful to Dr. Ignacy Doliński and Michał Kiljański for the tremendous work they put into geolocating all the cities of the Second Polish Republic.'
        ]
      }
    ]
  },
  pl: {
    sections: [
      {
        title: 'O Bazie Danych',
        paragraphs: [
          'Tekst na tej stronie z opisem danych został wygenerowany za pomocą AI dla celów demo.',
          'Projekt udostępnia kompleksową, cyfrową platformę do eksploracji i wizualizacji danych statystycznych na poziomie powiatów w Polsce z okresu międzywojennego (1918–1939). Po odzyskaniu niepodległości po I wojnie światowej II Rzeczpospolita stanęła przed ogromnym wyzwaniem odbudowy i modernizacji infrastruktury, gospodarki oraz systemów administracyjnych.',
          'Prezentowane zbiory dostarczają wglądu w krajobraz geograficzny, demograficzny i gospodarczy międzywojennej Polski, czerpiąc z historycznych roczników statystycznych, spisów powszechnych oraz ówczesnych dokumentów administracyjnych.'
        ]
      },
      {
        title: 'Źródła danych i metodologia',
        bullets: [
          'Roczniki Statystyczne (Polish Statistical Yearbooks)',
          'Spisy powszechne z lat 1921 i 1931',
          'Materiały Ministerstwa Spraw Wewnętrznych',
          'Regionalne opracowania gospodarcze i raporty',
          'Dokumentacja rozwoju infrastruktury'
        ],
        paragraphs: [
          'Wszystkie dane zostały zdigitalizowane i odwzorowane do historycznych granic powiatów. Każdy zbiór zawiera metadane opisujące źródła, daty pozyskania oraz uwagi metodologiczne, aby zapewnić przejrzystość i rzetelność naukową.'
        ]
      },
      {
        title: 'Implementacja techniczna',
        bullets: [
          'DuckDB‑WASM – szybkie zapytania analityczne po stronie przeglądarki (pliki Parquet)',
          'GeoJSON – historyczne granice powiatów dla wizualizacji przestrzennej',
          'Interaktywne mapy choropletyczne wskaźników powiatowych',
          'Hierarchiczna kategoryzacja zbiorów dla łatwiejszego wyszukiwania'
        ]
      },
      {
        title: 'Kontekst historyczny',
        paragraphs: [
          'Okres międzywojenny był czasem intensywnych przemian w Polsce. Po 123 latach zaborów odrodzone państwo musiało zintegrować ziemie podlegające wcześniej różnym systemom administracyjnym (rosyjskiemu, pruskiemu i austro‑węgierskiemu).',
          'Dane odzwierciedlają zarówno wyzwania, jak i osiągnięcia tamtych lat: rozwój portu w Gdyni, procesy industrializacji, rozbudowę szkolnictwa, poprawę infrastruktury oraz stopniową modernizację społeczeństwa i gospodarki.'
        ]
      },
      {
        title: 'Pomóż budować bazę danych!',
        paragraphs: [
          'Istnieje kilka zespołów danych stanowiących fascynujący materiał źródłowy na temat geografii ekonomicznej II RP:'
        ],
        bullets: [
          'Dane na temat stacjonowania armii - rekonstrukcja na temat źródeł wojskowych, nie pojawiają się w spisach. [materiał na pracę magisterską]',
          'Dane na temat elektrowni i zakładów przemysłowych pobierających prąd - jedne z geograficznie najbardziej szczegółowych danych na temat II RP publikowane w Statystyce Zakładów Elektrycznych w Polsce (1925-1936). [materiał na pracę magisterską]',
          'Dane na temat infrastruktury w miastach w 1931 r. (wyposażenia w instalacje elektryczne i gazowe, kanalizację, wodociąg, materiał konstrukcyjny ścian i dachów). [materiał na licencjat]',
          'Dane na temat wielkiej własności rolnej w 1921 (wielkość i użytkowanie gruntu w wielkiej własności prywatnej, kościelnej i publicznej + szczegółowy spis posiadanych maszyn rolniczych i zakładów produkcji rolnej). [materiał na licencjat lub pracę magisterską]',
          'Wszelkie typy danych z podziałem na płci (np. zatrudnienie kobiet według sektorów). Z powodów ograniczonych zasobów czasowych, większość danych w tej bazie była spisywana bez podziału na płci. [materiał na pracę licencjacką, magisterską, lub doktorską]'
        ],
        paragraphs: [
          'Jeśli fascynujesz się historią i chcesz wesprzeć wysiłek budowy tej bazy dzięki digitalizacji (w czasie wolnym czy w ramach swojej pracy naukowej), oferuję z mojej strony wsparcie w doborze najlepszych narzędzi cyfrowych do digitalizacji i wsparcie w opracowaniu źródeł.'
        ]
      },
      {
        title: 'Podziękowania',
        paragraphs: [
          'Dziękuję dr. Marcinowi Wrońskiemu za pomysł i nieustające wsparcie podczas budowy bazy danych. Dziękuję profesorowi Nikolausowi Wolfowi za rozbudzenie we mnie fascynacji ekonomią historyczną, niezrównane wykłady z historii ekonomii i opiekę nad moją pracą magisterską jako promotor mojej pracy magisterskiej.',
          'Dziękuję Mikołajowi Kiljańskiemu za digitalizację pierwszych wersji szczegółowych map powiatowych II RP. Dziękuję dr. Ignacemu Dolińskiemu i Michałowi Kiljańskiemu za ogromną pracę włożoną w geolokalizację wszystich miast II RP.'
        ]
      }
    ]
  }
}

