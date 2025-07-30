'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, User, AlertCircle, CheckCircle } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  uid: string;
  nickname: string;
  avatarUrl?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      loadUserProfile();
    }
  }, [user, loading]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const profileDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfile;
        setProfile(profileData);
        setNickname(profileData.nickname || '');
        setAvatarUrl(profileData.avatarUrl || '');
      } else {
        // Create initial profile
        const initialProfile: UserProfile = {
          uid: user.uid,
          nickname: user.displayName || '',
          email: user.email || '',
          avatarUrl: user.photoURL || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(doc(db, 'users', user.uid), initialProfile);
        setProfile(initialProfile);
        setNickname(initialProfile.nickname);
        setAvatarUrl(initialProfile.avatarUrl || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    
    setSaving(true);
    
    try {
      const updatedProfile = {
        ...profile,
        nickname: nickname.trim(),
        avatarUrl: avatarUrl.trim(),
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'users', user.uid), updatedProfile);
      setProfile(updatedProfile);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully!'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-code7x5">Profile Settings</h1>
          <p className="text-muted-foreground mt-2 font-gontserrat">
            Customize your profile to connect with the OmniCode community.
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Profile
            </CardTitle>
            <CardDescription>
              This information will be visible to other users in the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Upload Section */}
            <div className="space-y-4">
              <Label>Profile Picture</Label>
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                userId={user.uid}
                nickname={nickname || 'User'}
                onUploadComplete={(newUrl) => {
                  setAvatarUrl(newUrl);
                  // Auto-save the profile when avatar is updated
                  if (profile) {
                    const updatedProfile = {
                      ...profile,
                      avatarUrl: newUrl,
                      updatedAt: new Date()
                    };
                    updateDoc(doc(db, 'users', user.uid), updatedProfile);
                    setProfile(updatedProfile);
                  }
                }}
              />
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your display name"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                This is how other users will see you in the community. {nickname.length}/30 characters.
              </p>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your email address cannot be changed here.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={saveProfile}
                disabled={isSaving || !nickname.trim()}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Preview</CardTitle>
            <CardDescription>
              This is how your profile will appear to other users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatarUrl} alt={nickname || 'User'} />
                <AvatarFallback>
                  {(nickname || user.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{nickname || 'Your Nickname'}</p>
                <p className="text-sm text-muted-foreground">Community Member</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}