import { Button } from './ui/button';
import { useLanguage } from '../lib/i18n';
import { LanguageSelector } from './LanguageSelector';

interface WelcomePageProps {
  onExploreData: () => void;
  onAbout: () => void;
  heroImageUrl: string;
}

export function WelcomePage({ onExploreData, onAbout, heroImageUrl }: WelcomePageProps) {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen relative">
      {/* Full Screen Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <img
          src={heroImageUrl}
          alt="Interwar Poland - Opening of the Port in Gdynia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Language selector pinned to top-right of the landing overlay */}
          <LanguageSelector positionClass="absolute top-4 right-4 z-20" />
          <div className="text-center text-white px-4 max-w-4xl">
            <h1 className="mb-4">{t('welcome.title')}</h1>
            <p className="text-xl mb-8 opacity-90">
              {t('welcome.subtitle')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={onExploreData} 
                size="lg" 
                className="bg-white text-black hover:bg-white/80 transition-all"
              >
                {t('welcome.exploreButton')}
              </Button>
              <Button 
                onClick={onAbout} 
                size="lg" 
                className="bg-white text-black hover:bg-white/80 transition-all"
              >
                {t('welcome.aboutButton')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
