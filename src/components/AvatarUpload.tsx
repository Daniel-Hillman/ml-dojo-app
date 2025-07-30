'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, Camera, X, CheckCircle, AlertCircle, 
  Image as ImageIcon, Loader2 
} from 'lucide-react';
import { uploadAvatar, resizeImage } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userId: string;
  nickname: string;
  onUploadComplete: (newAvatarUrl: string) => void;
  className?: string;
}

export function AvatarUpload({ 
  currentAvatarUrl, 
  userId, 
  nickname, 
  onUploadComplete,
  className 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setSuccess(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Resize image for optimization
      const resizedFile = await resizeImage(file, 400, 400, 0.8);
      
      // Upload to Firebase
      const result = await uploadAvatar(resizedFile, userId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        setSuccess(true);
        onUploadComplete(result.url);
        
        // Clean up preview
        setTimeout(() => {
          URL.revokeObjectURL(preview);
          setPreviewUrl(null);
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Upload failed');
        URL.revokeObjectURL(preview);
        setPreviewUrl(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setError(null);
  };

  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Avatar Display */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={displayAvatarUrl} alt={nickname} />
            <AvatarFallback className="text-2xl font-semibold">
              {nickname.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
          
          {success && (
            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          {/* Upload Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
              isUploading && 'pointer-events-none opacity-50'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
          >
            <div className="flex flex-col items-center gap-2">
              {dragActive ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
              
              <div className="text-sm">
                <span className="font-medium text-primary">Click to upload</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to 5MB
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={isUploading}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Choose File
            </Button>
            
            {currentAvatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUploadComplete('')}
                disabled={isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert className="border-green-500 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            Avatar updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Tips */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Images are automatically resized to 400x400 pixels</p>
        <p>• Your previous avatar will be automatically deleted</p>
        <p>• Supported formats: JPEG, PNG, WebP</p>
      </div>
    </div>
  );
}