'use client';

import React, { useState } from 'react';
import { Share2, Copy, Twitter, Facebook, Linkedin, Github, Link, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LiveCodeBlock } from '@/components/LiveCodeBlock';
import QRCode from 'qrcode';

interface CodeSharingProps {
  code: string;
  language: string;
  title?: string;
  description?: string;
  onShare?: (platform: string) => void;
}

export function CodeSharing({ 
  code, 
  language, 
  title = 'Code Snippet',
  description = '',
  onShare 
}: CodeSharingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const { toast } = useToast();

  // Generate shareable URL (in real app, this would create a unique URL)
  const generateShareUrl = async () => {
    const baseUrl = window.location.origin;
    const encodedCode = encodeURIComponent(code);
    const url = `${baseUrl}/shared-code?code=${encodedCode}&lang=${language}&title=${encodeURIComponent(title)}`;
    setShareUrl(url);
    
    // Generate QR code
    try {
      const qrUrl = await QRCode.toDataURL(url);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
    
    return url;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareToSocial = (platform: string) => {
    const url = shareUrl || window.location.href;
    const message = customMessage || `Check out this ${language} code snippet: ${title}`;
    
    let shareLink = '';
    
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'github':
        // For GitHub, we'd typically create a gist
        shareLink = 'https://gist.github.com/';
        break;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
      onShare?.(platform);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) {
      await generateShareUrl();
    }
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 size={16} />
        Share
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Share Code Snippet</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </div>

            {/* Code Preview */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">{title}</h4>
                <Badge variant="outline">{language}</Badge>
              </div>
              {description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {description}
                </p>
              )}
              <div className="border rounded-lg overflow-hidden">
                <LiveCodeBlock
                  code={code}
                  language={language}
                  showLineNumbers={true}
                  editable={false}
                  maxHeight="200px"
                />
              </div>
            </div>

            {/* Share URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Share Link</label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  placeholder="Generating share link..."
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(shareUrl)}
                  disabled={!shareUrl}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* Custom Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Custom Message (Optional)</label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a custom message for social media..."
                rows={3}
              />
            </div>

            {/* Social Media Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Share on Social Media</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => shareToSocial('twitter')}
                  className="flex items-center gap-2"
                  disabled={!shareUrl}
                >
                  <Twitter size={16} className="text-blue-400" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareToSocial('facebook')}
                  className="flex items-center gap-2"
                  disabled={!shareUrl}
                >
                  <Facebook size={16} className="text-blue-600" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareToSocial('linkedin')}
                  className="flex items-center gap-2"
                  disabled={!shareUrl}
                >
                  <Linkedin size={16} className="text-blue-700" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareToSocial('github')}
                  className="flex items-center gap-2"
                >
                  <Github size={16} />
                  GitHub Gist
                </Button>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">QR Code</label>
                <div className="flex items-center gap-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Scan this QR code to quickly access the shared code snippet
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <Button onClick={() => copyToClipboard(shareUrl)} disabled={!shareUrl}>
                <Copy size={16} className="mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Quick share button for code blocks
export function QuickShareButton({ 
  code, 
  language, 
  title 
}: { 
  code: string; 
  language: string; 
  title?: string; 
}) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const quickShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || 'Code Snippet',
          text: `Check out this ${language} code snippet`,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(code);
        toast({
          title: "Copied!",
          description: "Code copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={quickShare}
      disabled={isSharing}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Share2 size={14} />
    </Button>
  );
}

// Share statistics component
export function ShareStats({ 
  shares, 
  views, 
  likes 
}: { 
  shares: number; 
  views: number; 
  likes: number; 
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-1">
        <Share2 size={14} />
        {shares} shares
      </div>
      <div className="flex items-center gap-1">
        <span>👁</span>
        {views} views
      </div>
      <div className="flex items-center gap-1">
        <span>❤️</span>
        {likes} likes
      </div>
    </div>
  );
}