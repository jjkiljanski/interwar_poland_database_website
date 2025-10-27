import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '../lib/i18n';

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-transparent">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
          >
            <Languages className="h-4 w-4" />
            <span className="sr-only">{t('language.select')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-accent' : ''}
          >
            🇬🇧 {t('language.en')}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setLanguage('pl')}
            className={language === 'pl' ? 'bg-accent' : ''}
          >
            🇵🇱 {t('language.pl')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
