import React, { useState, useEffect } from 'react';
import { Play, Video, Youtube } from 'lucide-react';
import { youtubeService, YouTubeVideo } from '@/services/youtubeService';

const YouTubeSection = () => {
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Default content for fallback
  const defaultContent = {
    title: "Guarda Come Prepariamo le Nostre Pizze",
    description: "Scopri i segreti della nostra cucina e la passione che mettiamo nella preparazione di ogni pizza. Dal nostro forno a legna alla tua tavola.",
    youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
  };

  useEffect(() => {
    const loadVideoContent = async () => {
      try {
        setIsLoading(true);
        const video = await youtubeService.getFirstActiveVideo();

        if (video) {
          setCurrentVideo(video);
        } else {
          console.log('No active YouTube videos found, using default content');
        }
      } catch (error) {
        console.error('Error loading YouTube video:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVideoContent();
  }, []);

  // Get current video data or fallback to default
  const getVideoData = () => {
    if (currentVideo) {
      return {
        title: currentVideo.title,
        description: currentVideo.description,
        youtubeUrl: currentVideo.youtube_url,
        thumbnailUrl: currentVideo.thumbnail_url || youtubeService.getThumbnailUrl(currentVideo.youtube_url)
      };
    }
    return defaultContent;
  };

  const videoData = getVideoData();

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto mb-8"></div>
              <div className="h-64 bg-gray-300 rounded-3xl max-w-5xl mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Youtube className="w-8 h-8 text-red-600" />
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-gray-800">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500">
                {videoData.title}
              </span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {videoData.description}
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto animate-fade-in-up animate-stagger-1">
          <div className="relative group">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-gradient-to-br from-red-100 to-orange-100">
              {!showVideo ? (
                <>
                  {/* Video Thumbnail */}
                  <div className="relative">
                    <img
                      src={videoData.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-64 md:h-96 lg:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                      onLoad={() => setIsVideoLoaded(true)}
                      onError={(e) => {
                        // Fallback to default thumbnail
                        e.currentTarget.src = defaultContent.thumbnailUrl;
                      }}
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300"></div>
                    
                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => setShowVideo(true)}
                        className="group/play bg-red-600 hover:bg-red-700 text-white rounded-full p-6 md:p-8 transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-red-500/25 animate-pulse-glow"
                      >
                        <Play className="w-8 h-8 md:w-12 md:h-12 ml-1 group-hover/play:scale-110 transition-transform duration-300" fill="currentColor" />
                      </button>
                    </div>
                    
                    {/* Video Badge */}
                    <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce-gentle">
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4" />
                        <span>Video Esclusivo</span>
                      </div>
                    </div>
                    
                    {/* Duration Badge (placeholder) */}
                    <div className="absolute bottom-6 right-6 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
                      <span>3:45</span>
                    </div>
                  </div>
                </>
              ) : (
                /* YouTube Embed */
                <div className="relative pb-[56.25%] h-0 overflow-hidden">
                  <iframe
                    src={youtubeService.getEmbedUrl(videoData.youtubeUrl)}
                    title={videoData.title}
                    className="absolute top-0 left-0 w-full h-full rounded-3xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          </div>
          
          {/* Video Info */}
          <div className="mt-8 text-center animate-fade-in-up animate-stagger-2">
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex items-center space-x-2 text-red-600">
                <Youtube className="w-5 h-5" />
                <span className="font-semibold">Canale Ufficiale</span>
              </div>
              <div className="flex items-center space-x-2 text-orange-500">
                <Play className="w-5 h-5" />
                <span className="font-semibold">Contenuti Esclusivi</span>
              </div>
              <div className="flex items-center space-x-2 text-green-600">
                <Video className="w-5 h-5" />
                <span className="font-semibold">Dietro le Quinte</span>
              </div>
            </div>
            
            {!showVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="mt-6 bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-3 rounded-full font-semibold hover:from-red-700 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <span className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>Guarda il Video</span>
                </span>
              </button>
            )}
          </div>
        </div>
        
        {/* Additional Video Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 animate-fade-in-up animate-stagger-3">
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Ricette Tradizionali</h3>
            <p className="text-gray-600">Scopri i segreti delle nostre ricette tramandate di generazione in generazione</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Processo Artigianale</h3>
            <p className="text-gray-600">Guarda come prepariamo ogni pizza con passione e dedizione artigianale</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Youtube className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Contenuti Esclusivi</h3>
            <p className="text-gray-600">Accedi a contenuti esclusivi e dietro le quinte della nostra pizzeria</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default YouTubeSection;
