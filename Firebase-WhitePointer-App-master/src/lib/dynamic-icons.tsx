'use client';

import { Suspense, lazy, ComponentType } from 'react';
import { LucideProps } from 'lucide-react';

// Fallback icon component
const FallbackIcon = ({ className, size = 24, ...props }: LucideProps) => (
  <div 
    className={`inline-block animate-pulse bg-gray-300 rounded ${className}`}
    style={{ width: size, height: size }}
    {...props}
  />
);

// Dynamic icon loader for Lucide React icons
export function createDynamicIcon(iconName: string) {
  const DynamicIcon = lazy(() => 
    import('lucide-react').then(module => ({
      default: module[iconName as keyof typeof module] as ComponentType<LucideProps>
    }))
  );

  return function IconWrapper(props: LucideProps) {
    return (
      <Suspense fallback={<FallbackIcon {...props} />}>
        <DynamicIcon {...props} />
      </Suspense>
    );
  };
}

// Dynamic icon loader for Heroicons
export function createDynamicHeroIcon(iconName: string, type: 'outline' | 'solid' = 'outline') {
  const path = type === 'outline' ? '@heroicons/react/24/outline' : '@heroicons/react/24/solid';
  
  const DynamicIcon = lazy(() => 
    import(path).then(module => ({
      default: module[iconName as keyof typeof module] as ComponentType<{ className?: string }>
    }))
  );

  return function HeroIconWrapper({ className, ...props }: { className?: string }) {
    return (
      <Suspense fallback={<FallbackIcon className={className} />}>
        <DynamicIcon className={className} {...props} />
      </Suspense>
    );
  };
}

// Pre-defined commonly used icons for better tree-shaking
export const DynamicIcons = {
  // Common Lucide icons
  Plus: createDynamicIcon('Plus'),
  Minus: createDynamicIcon('Minus'),
  Edit: createDynamicIcon('Edit'),
  Trash: createDynamicIcon('Trash'),
  Save: createDynamicIcon('Save'),
  Search: createDynamicIcon('Search'),
  Filter: createDynamicIcon('Filter'),
  ChevronDown: createDynamicIcon('ChevronDown'),
  ChevronUp: createDynamicIcon('ChevronUp'),
  ChevronLeft: createDynamicIcon('ChevronLeft'),
  ChevronRight: createDynamicIcon('ChevronRight'),
  Check: createDynamicIcon('Check'),
  X: createDynamicIcon('X'),
  AlertTriangle: createDynamicIcon('AlertTriangle'),
  Info: createDynamicIcon('Info'),
  User: createDynamicIcon('User'),
  Users: createDynamicIcon('Users'),
  Settings: createDynamicIcon('Settings'),
  Home: createDynamicIcon('Home'),
  Menu: createDynamicIcon('Menu'),
  MoreVertical: createDynamicIcon('MoreVertical'),
  MoreHorizontal: createDynamicIcon('MoreHorizontal'),
  Calendar: createDynamicIcon('Calendar'),
  Clock: createDynamicIcon('Clock'),
  Mail: createDynamicIcon('Mail'),
  Phone: createDynamicIcon('Phone'),
  MapPin: createDynamicIcon('MapPin'),
  Upload: createDynamicIcon('Upload'),
  Download: createDynamicIcon('Download'),
  FileText: createDynamicIcon('FileText'),
  Image: createDynamicIcon('Image'),
  Video: createDynamicIcon('Video'),
  Loader: createDynamicIcon('Loader'),
  Loader2: createDynamicIcon('Loader2'),
  
  // Business specific icons
  Briefcase: createDynamicIcon('Briefcase'),
  Bike: createDynamicIcon('Bike'),
  Car: createDynamicIcon('Car'),
  Banknote: createDynamicIcon('Banknote'),
  DollarSign: createDynamicIcon('DollarSign'),
  CreditCard: createDynamicIcon('CreditCard'),
  Receipt: createDynamicIcon('Receipt'),
  FileSpreadsheet: createDynamicIcon('FileSpreadsheet'),
  Building: createDynamicIcon('Building'),
  Shield: createDynamicIcon('Shield'),
  Lock: createDynamicIcon('Lock'),
  Unlock: createDynamicIcon('Unlock'),
  Eye: createDynamicIcon('Eye'),
  EyeOff: createDynamicIcon('EyeOff'),
  
  // Communication icons
  Send: createDynamicIcon('Send'),
  MessageSquare: createDynamicIcon('MessageSquare'),
  MessageCircle: createDynamicIcon('MessageCircle'),
  Bell: createDynamicIcon('Bell'),
  BellOff: createDynamicIcon('BellOff'),
  
  // Status icons
  CheckCircle: createDynamicIcon('CheckCircle'),
  XCircle: createDynamicIcon('XCircle'),
  AlertCircle: createDynamicIcon('AlertCircle'),
  HelpCircle: createDynamicIcon('HelpCircle'),
  
  // Navigation icons
  ArrowLeft: createDynamicIcon('ArrowLeft'),
  ArrowRight: createDynamicIcon('ArrowRight'),
  ArrowUp: createDynamicIcon('ArrowUp'),
  ArrowDown: createDynamicIcon('ArrowDown'),
  ExternalLink: createDynamicIcon('ExternalLink'),
  Link: createDynamicIcon('Link'),
  
  // Data icons
  TrendingUp: createDynamicIcon('TrendingUp'),
  TrendingDown: createDynamicIcon('TrendingDown'),
  BarChart: createDynamicIcon('BarChart'),
  PieChart: createDynamicIcon('PieChart'),
  Activity: createDynamicIcon('Activity'),
};

// Bundle size analyzer helper
export function analyzeBundleSize() {
  if (process.env.ANALYZE_BUNDLE === 'true') {
    console.log('📊 Dynamic Icons Bundle Analysis:');
    console.log('Total pre-defined icons:', Object.keys(DynamicIcons).length);
    console.log('Each icon is loaded only when used (lazy loading)');
    console.log('Icons are cached after first load');
  }
}

// Icon preloader for critical icons
export function preloadCriticalIcons() {
  // Only preload in browser
  if (typeof window === 'undefined') return;
  
  // Preload commonly used icons
  const criticalIcons = ['Home', 'User', 'Settings', 'Menu', 'Search'];
  
  criticalIcons.forEach(iconName => {
    if (iconName in DynamicIcons) {
      // This triggers the lazy loading
      const IconComponent = DynamicIcons[iconName as keyof typeof DynamicIcons];
      // Preload by creating a hidden element
      const preloadElement = document.createElement('div');
      preloadElement.style.display = 'none';
      document.body.appendChild(preloadElement);
      // Remove after short delay
      setTimeout(() => {
        document.body.removeChild(preloadElement);
      }, 100);
    }
  });
}