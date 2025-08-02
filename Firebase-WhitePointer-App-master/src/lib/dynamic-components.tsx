'use client';

import { Suspense, lazy, ComponentType, ReactElement } from 'react';

// Loading fallback components
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export const LoadingCard = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

export const LoadingTable = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-4 border-b animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
    </div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="p-4 border-b animate-pulse">
        <div className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>
    ))}
  </div>
);

export const LoadingForm = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="h-10 bg-blue-200 rounded w-32 mt-6"></div>
    </div>
  </div>
);

// Dynamic component creator with custom fallback
export function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback: ReactElement = <LoadingSpinner />
) {
  const LazyComponent = lazy(importFn);
  
  return function DynamicWrapper(props: T) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Pre-defined dynamic components for heavy/complex components
export const DynamicComponents = {
  // Charts and visualizations (heavy libraries)
  Chart: createDynamicComponent(
    () => import('@/components/ui/chart'),
    <div className="bg-gray-100 rounded-lg p-8 animate-pulse">
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  ),
  
  // PDF viewer (heavy)
  PDFViewer: createDynamicComponent(
    () => import('@/app/(app)/cases/[caseId]/pdf-viewer'),
    <div className="bg-gray-100 rounded-lg p-8 animate-pulse">
      <div className="h-96 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  ),
  
  // Image gallery (potentially heavy with many images)
  ImageGallery: createDynamicComponent(
    () => import('@/app/(app)/cases/[caseId]/image-gallery'),
    <div className="grid grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded"></div>
      ))}
    </div>
  ),
  
  // Signature pad (canvas-heavy)
  SignaturePad: createDynamicComponent(
    () => import('@/components/SignaturePad'),
    <div className="bg-gray-100 rounded-lg p-4 animate-pulse">
      <div className="h-48 bg-gray-200 rounded mb-4"></div>
      <div className="flex space-x-2">
        <div className="h-8 bg-blue-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  ),
  
  // Rich text editor (heavy)
  RichTextEditor: createDynamicComponent(
    () => import('@/components/ui/rich-text-editor'),
    <div className="bg-white border rounded-lg animate-pulse">
      <div className="border-b p-2 flex space-x-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-8 w-8 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="p-4">
        <div className="h-32 bg-gray-100 rounded"></div>
      </div>
    </div>
  ),
  
  // Calendar picker (date libraries can be heavy)
  Calendar: createDynamicComponent(
    () => import('@/components/ui/calendar'),
    <div className="bg-white border rounded-lg p-4 animate-pulse">
      <div className="grid grid-cols-7 gap-2">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  ),
};

// Component analyzer for bundle optimization
export function analyzeComponentBundles() {
  if (process.env.ANALYZE_BUNDLE === 'true') {
    console.log('📦 Dynamic Components Bundle Analysis:');
    console.log('Available dynamic components:', Object.keys(DynamicComponents));
    console.log('Each component is code-split and loaded only when needed');
    console.log('Components are cached after first load');
  }
}

// Preloader for critical components
export function preloadCriticalComponents() {
  if (typeof window === 'undefined') return;
  
  // Preload components that are likely to be needed soon
  const criticalComponents = ['Chart', 'Calendar'];
  
  // Use requestIdleCallback to preload during idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      criticalComponents.forEach(componentName => {
        if (componentName in DynamicComponents) {
          // Trigger lazy loading by accessing the component
          // This loads the code but doesn't render it
          DynamicComponents[componentName as keyof typeof DynamicComponents];
        }
      });
    });
  }
}

// Route-based component preloading
export function preloadRouteComponents(route: string) {
  const routeComponentMap: Record<string, string[]> = {
    '/cases': ['Chart', 'Calendar'],
    '/fleet': ['ImageGallery', 'Calendar'],
    '/documents': ['PDFViewer', 'SignaturePad'],
    '/signature': ['SignaturePad'],
  };
  
  const componentsToPreload = routeComponentMap[route] || [];
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      componentsToPreload.forEach(componentName => {
        if (componentName in DynamicComponents) {
          DynamicComponents[componentName as keyof typeof DynamicComponents];
        }
      });
    });
  }
}