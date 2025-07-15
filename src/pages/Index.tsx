
import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import Hero from '../components/Hero';
import WeOffer from '../components/WeOffer';
import YouTubeSection from '../components/YouTubeSection';
import Products from '../components/Products';
import Gallery from '../components/Gallery';
import UnifiedOrderTracker from '../components/UnifiedOrderTracker';
import About from '../components/About';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';
// Pizzeria Regina 2000 Torino - Complete transformation


const Index = () => {
  return (
    <div className="min-h-screen font-inter overflow-x-hidden">
      <Header />
      <ErrorBoundary componentName="Hero">
        <div className="animate-fade-in-up">
          <Hero />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="WeOffer">
        <div className="animate-fade-in-up animate-stagger-1">
          <WeOffer />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="YouTubeSection">
        <div className="animate-fade-in-up animate-stagger-2">
          <YouTubeSection />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="Products">
        <div className="animate-fade-in-right animate-stagger-3">
          <Products />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="Gallery">
        <div className="animate-fade-in-up animate-stagger-4">
          <Gallery />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="UnifiedOrderTracker">
        <div className="animate-fade-in-up animate-stagger-5">
          <UnifiedOrderTracker />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="About">
        <div className="animate-slide-in-up animate-stagger-6">
          <About />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="ContactSection">
        <div className="animate-fade-in-up animate-stagger-7">
          <ContactSection />
        </div>
      </ErrorBoundary>
      <ErrorBoundary componentName="Footer">
        <div className="animate-fade-in-up animate-stagger-8">
          <Footer />
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default Index;
