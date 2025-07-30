"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { auth, db } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// Removed Bot icon import for cleaner title design
import FaultyTerminal from "@/components/FaultyTerminal";
// Removed FontTest import - font is working perfectly now

export default function LoginPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          createdAt: serverTimestamp(),
        });

        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      }
      router.push('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Terminal Background */}
      <div className="absolute inset-0 z-0">
        <FaultyTerminal
          scale={1.2}
          gridMul={[2, 1]}
          digitSize={1.0}
          timeScale={0.5}
          pause={false}
          scanlineIntensity={0.8}
          glitchAmount={1.2}
          flickerAmount={0.7}
          noiseAmp={0.8}
          chromaticAberration={2}
          dither={0.3}
          curvature={0.1}
          tint="#00ff41"
          mouseReact={true}
          mouseStrength={0.3}
          pageLoadAnimation={true}
          brightness={0.8}
          className="w-full h-full"
        />
      </div>

      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Login Form */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4 space-y-8">
        {/* OmniCode Title - Outside the card for better visibility */}
        <div className="text-center">
          <h1 className="text-9xl font-aurora aurora-title text-green-400 tracking-wider mb-6 drop-shadow-2xl">
            OmniCode
          </h1>
          <div className="h-1 w-48 bg-gradient-to-r from-transparent via-green-400 to-transparent mx-auto mb-4"></div>
          <p className="text-green-300/80 font-mono text-sm">
            {"Full stack AI Training Environment"}
          </p>
        </div>

        <Card className="w-full max-w-sm border-2 border-green-500/30 shadow-2xl shadow-green-500/20 bg-black/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-xl text-green-300 font-mono">
              {isLogin ? "> Access Terminal" : "> Initialize User"}
            </CardTitle>
            <CardDescription className="text-green-400/70 font-mono text-sm">
              {isLogin ? "Enter credentials to access your vault" : "Create new user account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/50 border-green-500/50 text-green-100 placeholder:text-green-300/50 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-green-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black/50 border-green-500/50 text-green-100 placeholder:text-green-300/50 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>
            <Button
              onClick={handleAuth}
              disabled={isLoading}
              className="w-full text-lg py-6 bg-green-500 hover:bg-green-400 text-black font-semibold shadow-lg shadow-green-500/30 transition-all duration-200 hover:shadow-green-400/40"
            >
              {isLoading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
            </Button>
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-green-300 hover:text-green-200"
            >
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </Button>
          </CardContent>
        </Card>
      </div>


    </div>
  );
}
