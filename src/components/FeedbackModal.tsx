import React, { useState, useRef, useEffect } from 'react';
import { X, Bold, Italic, List, Quote, Type, Zap } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  adId: string;
  adDetails: {
    platform: string;
    ad_type: string;
    audience?: string;
  };
  onSubmit: (feedback: string) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

interface FormatButton {
  icon: React.ReactNode;
  command: string;
  title: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  adId, // Reserved for future use (tracking, analytics)
  adDetails,
  onSubmit,
  onClose,
  isSubmitting = false
}) => {
  const [feedback, setFeedback] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Feedback templates for common revision requests
  const feedbackTemplates = [
    {
      id: 'tone',
      label: 'Adjust Tone',
      template: 'Please adjust the tone to be more [professional/casual/friendly/urgent]. The current tone doesn\'t match our brand voice.'
    },
    {
      id: 'cta',
      label: 'Improve Call-to-Action',
      template: 'The call-to-action needs to be stronger and more compelling. Consider using action words like "Discover", "Transform", or "Get Started".'
    },
    {
      id: 'length',
      label: 'Adjust Length',
      template: 'Please [shorten/expand] the content. The current length is [too long/too short] for the target platform and audience.'
    },
    {
      id: 'benefits',
      label: 'Highlight Benefits',
      template: 'Focus more on the benefits and value proposition. Explain how this product solves the customer\'s specific problems.'
    },
    {
      id: 'audience',
      label: 'Better Audience Targeting',
      template: `This doesn't seem targeted enough for ${adDetails.audience || 'the target audience'}. Please make it more relevant to their specific needs and interests.`
    },
    {
      id: 'platform',
      label: 'Platform Optimization',
      template: `Optimize this content specifically for ${adDetails.platform}. Consider the platform's best practices and user behavior patterns.`
    },
    {
      id: 'visual',
      label: 'Visual Elements',
      template: 'The visual elements need improvement. Consider [different colors/better composition/clearer imagery/more engaging design].'
    },
    {
      id: 'brand',
      label: 'Brand Alignment',
      template: 'This doesn\'t align well with our brand guidelines. Please ensure it matches our brand voice, style, and messaging.'
    }
  ];

  // Format buttons for rich text editing simulation
  const formatButtons: FormatButton[] = [
    { icon: <Bold className="w-4 h-4" />, command: 'bold', title: 'Bold' },
    { icon: <Italic className="w-4 h-4" />, command: 'italic', title: 'Italic' },
    { icon: <List className="w-4 h-4" />, command: 'list', title: 'Bullet List' },
    { icon: <Quote className="w-4 h-4" />, command: 'quote', title: 'Quote' }
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFeedback('');
      setSelectedTemplate('');
    }
  }, [isOpen]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setFeedback(template);
    textareaRef.current?.focus();
  };

  const handleFormatClick = (command: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = feedback.substring(start, end);
    let newText = feedback;

    switch (command) {
      case 'bold':
        if (selectedText) {
          newText = feedback.substring(0, start) + `**${selectedText}**` + feedback.substring(end);
        } else {
          newText = feedback.substring(0, start) + '**bold text**' + feedback.substring(end);
        }
        break;
      case 'italic':
        if (selectedText) {
          newText = feedback.substring(0, start) + `*${selectedText}*` + feedback.substring(end);
        } else {
          newText = feedback.substring(0, start) + '*italic text*' + feedback.substring(end);
        }
        break;
      case 'list':
        const listItem = selectedText || 'List item';
        newText = feedback.substring(0, start) + `\n• ${listItem}` + feedback.substring(end);
        break;
      case 'quote':
        const quoteText = selectedText || 'Quoted text';
        newText = feedback.substring(0, start) + `\n> ${quoteText}` + feedback.substring(end);
        break;
    }

    setFeedback(newText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = command === 'bold' || command === 'italic'
        ? start + (selectedText ? selectedText.length + 4 : 2)
        : start + newText.length - feedback.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && !isSubmitting) {
      e.preventDefault();
      onClose();
    }
  };

  // Handle escape key globally when modal is open
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal when clicking backdrop (not when clicking modal content)
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Provide Revision Feedback
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {adDetails.platform} • {adDetails.ad_type.replace('_', ' ').toUpperCase()}
              {adDetails.audience && ` • ${adDetails.audience}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Quick Templates */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Templates:</h4>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.template)}
                  className={`p-3 text-left text-sm rounded-lg border transition-colors ${selectedTemplate === template.template
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  disabled={isSubmitting}
                >
                  <div className="font-medium">{template.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Rich Text Toolbar */}
          <div className="mb-3">
            <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg border">
              <div className="flex items-center space-x-1">
                {formatButtons.map((button) => (
                  <button
                    key={button.command}
                    onClick={() => handleFormatClick(button.command)}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title={button.title}
                    disabled={isSubmitting}
                  >
                    {button.icon}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <div className="text-xs text-gray-500 flex items-center space-x-4">
                <span className="flex items-center">
                  <Type className="w-3 h-3 mr-1" />
                  Markdown supported
                </span>
                <span className="flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Ctrl+Enter to submit
                </span>
              </div>
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="mb-4">
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Feedback:
            </label>
            <textarea
              ref={textareaRef}
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what changes you'd like to see in this ad. Be specific about tone, messaging, visual elements, or any other improvements..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-gray-500">
                {feedback.length} characters
              </div>
              <div className="text-xs text-gray-500">
                Use **bold**, *italic*, • lists, and {'>'} quotes
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-800 mb-2">💡 Feedback Guidelines:</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Be specific about what needs to change</li>
              <li>• Explain the reasoning behind your feedback</li>
              <li>• Suggest alternatives when possible</li>
              <li>• Consider the target audience and platform</li>
              <li>• Focus on one main improvement area per revision</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!feedback.trim() || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;