"use client";

import { useState, useEffect, useCallback } from "react";
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import Markdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "lodash";
import { db, auth } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';

export default function NotesPage() {
  const { toast } = useToast();
  const [user, loading] = useAuthState(auth);
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // This useEffect now correctly depends on the `user` object from useAuthState.
  // It will only run when the user's login status is known and changes.
  useEffect(() => {
    setMounted(true);
    const fetchNote = async () => {
      // We only proceed if the user object is available.
      if (user) {
        const noteDoc = doc(db, "notes", user.uid);
        const noteSnapshot = await getDoc(noteDoc);
        if (noteSnapshot.exists()) {
          setValue(noteSnapshot.data().content);
        }
      }
    };
    fetchNote();
  }, [user]); // The dependency on `user` is crucial.

  const saveNote = useCallback(
    debounce(async (content: string) => {
      setIsSaving(true);
      // We also check for the user here before saving.
      if (user) {
        try {
          const noteDoc = doc(db, "notes", user.uid);
          await setDoc(noteDoc, { content }, { merge: true });
          toast({
            title: "Saved",
            description: "Your note has been saved.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to save note.",
            variant: "destructive",
          });
        }
      }
      setIsSaving(false);
    }, 1000),
    [user, toast] // Ensure `user` is a dependency here as well.
  );

  const handleChange = (newValue: string) => {
    setValue(newValue);
    saveNote(newValue);
  };
  
  // Display a loading message while Firebase checks the auth state.
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-1/2 p-4">
        {mounted && <SimpleMDE value={value} onChange={handleChange} />}
        {isSaving && <div className="text-sm text-muted-foreground">Saving...</div>}
      </div>
      <div className="w-1/2 p-4 border-l">
        <Markdown>{value}</Markdown>
      </div>
    </div>
  );
}
