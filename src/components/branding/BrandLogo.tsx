import Link from 'next/link';
import { Branding } from '@/config/branding';

interface Props {
  variant?: 'horizontal' | 'stacked' | 'white' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
  companyLogoUrl?: string;
  companyName?: string;
}

const sizes = {
  sm: { width: 140, height: 40, iconSize: 24, text: 'text-sm' },
  md: { width: 180, height: 50, iconSize: 32, text: 'text-base' },
  lg: { width: 220, height: 60, iconSize: 40, text: 'text-lg' },
  xl: { width: 300, height: 80, iconSize: 50, text: 'text-xl' },
};

export function BrandLogo({ 
  variant = 'horizontal', 
  size = 'md', 
  className = '', 
  clickable = false,
  companyLogoUrl,
  companyName
}: Props) {
  const defaultSrc = Branding.logos[variant] || Branding.logos.horizontal;
  const { width, height, iconSize, text } = sizes[size];
  
  const content = companyLogoUrl ? (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={companyLogoUrl} 
        alt={companyName || 'Company Logo'}
        style={{ width: iconSize, height: iconSize, objectFit: 'contain', borderRadius: '8px' }}
      />
      {variant !== 'stacked' && (
        <span className={`font-bold ${text} text-foreground truncate`} style={{ maxWidth: width - iconSize - 10 }}>
          {companyName || Branding.appName}
        </span>
      )}
    </div>
  ) : (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={defaultSrc} 
        alt={`${Branding.appName} Logo`} 
        width={width}
        height={height}
        className={`object-contain ${className}`}
      />
    </>
  );

  if (clickable) {
    return <Link href="/home">{content}</Link>;
  }
  return content;
}