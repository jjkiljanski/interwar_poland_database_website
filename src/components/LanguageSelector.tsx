import { Languages } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useLanguage } from '../lib/i18n';

export function LanguageSelector({ positionClass }: { positionClass?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const wrapperClass = positionClass ?? 'fixed top-4 right-4 z-50 bg-transparent';

  return (
    <div className={wrapperClass}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-white text-black border-gray-300 hover:bg-gray-100 hover:text-black"
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
            🇬🇧 {'English'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setLanguage('pl')}
            className={language === 'pl' ? 'bg-accent' : ''}
          >
            🇵🇱 {'Polski'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
