import { useState } from 'react'
import { Play, Pause, Volume2, Download, ExternalLink } from 'lucide-react'

export default function MultimediaContent({ content }) {
  const [isPlaying, setIsPlaying] = useState(false)

  const renderContent = () => {
    switch (content.content_type) {
      case 'text':
        return renderText()
      case 'image':
        return renderImage()
      case 'video':
        return renderVideo()
      case 'audio':
        return renderAudio()
      case 'pdf':
        return renderPDF()
      case 'embed':
        return renderEmbed()
      default:
        return <div className="text-gray-500">Unsupported content type: {content.content_type}</div>
    }
  }

  const renderText = () => {
    const { html, plain_text } = content.content_data
    
    return (
      <div className="prose prose-lg max-w-none">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="whitespace-pre-wrap">{plain_text}</div>
        )}
      </div>
    )
  }

  const renderImage = () => {
    const { url, alt_text, caption, width, height } = content.content_data
    
    return (
      <div className="text-center">
        <img
          src={url}
          alt={alt_text || content.title || 'Image'}
          className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
          style={{ 
            maxWidth: width ? `${width}px` : '100%',
            maxHeight: height ? `${height}px` : 'auto'
          }}
        />
        {caption && (
          <p className="text-sm text-gray-600 mt-2 italic">{caption}</p>
        )}
      </div>
    )
  }

  const renderVideo = () => {
    const { url, embed_url, thumbnail, duration, description } = content.content_data
    
    // Handle YouTube URLs
    if (url && url.includes('youtube.com')) {
      const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
      const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : embed_url
      
      return (
        <div className="space-y-4">
          <div className="relative aspect-video">
            <iframe
              src={embedUrl}
              title={content.title || 'Video'}
              className="w-full h-full rounded-lg"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          {duration && (
            <p className="text-xs text-gray-500">Duration: {duration}</p>
          )}
        </div>
      )
    }
    
    // Handle other video URLs
    return (
      <div className="space-y-4">
        <video
          controls
          className="w-full rounded-lg"
          poster={thumbnail}
        >
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
    )
  }

  const renderAudio = () => {
    const { url, duration, transcript } = content.content_data
    
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <Volume2 className="h-6 w-6 text-gray-600" />
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
          {duration && (
            <p className="text-xs text-gray-500 mt-2">Duration: {duration}</p>
          )}
        </div>
        {transcript && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Transcript</h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
          </div>
        )}
      </div>
    )
  }

  const renderPDF = () => {
    const { url, filename, page_count } = content.content_data
    
    return (
      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">{filename || 'PDF Document'}</h4>
            {page_count && (
              <p className="text-sm text-gray-600">{page_count} pages</p>
            )}
          </div>
          <div className="flex space-x-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </a>
            <a
              href={url}
              download={filename}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </div>
        </div>
        
        {/* Embedded PDF viewer */}
        <div className="mt-4">
          <iframe
            src={url}
            className="w-full h-96 border border-gray-300 rounded"
            title={filename || 'PDF Document'}
          />
        </div>
      </div>
    )
  }

  const renderEmbed = () => {
    const { embed_code, source, url } = content.content_data
    
    return (
      <div className="space-y-4">
        <div 
          className="embed-container"
          dangerouslySetInnerHTML={{ __html: embed_code }}
        />
        {source && (
          <p className="text-xs text-gray-500">Source: {source}</p>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            View original
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="multimedia-content-item mb-8">
      {content.title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {content.title}
        </h3>
      )}
      
      <div className="content-body">
        {renderContent()}
      </div>
    </div>
  )
}
