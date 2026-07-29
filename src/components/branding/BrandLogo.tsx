/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Branding } from '@/config/branding';

interface Props {
  variant?: 'horizontal' | 'stacked' | 'white' | 'monochrome';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
}

const sizes = {
  sm: { width: 140, height: 40 },
  md: { width: 180, height: 50 },
  lg: { width: 220, height: 60 },
  xl: { width: 300, height: 80 },
};

export function BrandLogo({ variant = 'horizontal', size = 'md', className = '', clickable = false }: Props) {
  const src = Branding.logos[variant] || Branding.logos.horizontal;
  const { width, height } = sizes[size];
  
  const content = (
    <img 
      src={src} 
      alt={`${Branding.appName} Logo`} 
      width={width}
      height={height}
      className={`object-contain ${className}`}
    />
  );

  if (clickable) {
    return <Link href="/home">{content}</Link>;
  }
  return content;
}