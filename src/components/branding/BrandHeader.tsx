import { BrandLogo } from './BrandLogo';

interface Props {
  className?: string;
  companyLogoUrl?: string;
  companyName?: string;
}

export function BrandHeader({ className = '', companyLogoUrl, companyName }: Props) {
  return (
    <header className={`flex items-center gap-3 ${className}`}>
      <BrandLogo 
        variant="horizontal" 
        size="md" 
        clickable 
        companyLogoUrl={companyLogoUrl}
        companyName={companyName}
      />
    </header>
  );
}