"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { php } from '@codemirror/lang-php';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { markdown } from '@codemirror/lang-markdown';
import { generateDrillAction } from "@/lib/actions";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase/client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { ApiKeyStatus } from "@/components/ApiKeyStatus";
import { LiveCodeBlock } from "@/components/LiveCodeBlock";
import { DrillCreationHelp } from "@/components/tooltips/ContextualHelp";

const contentSchema = z.union([
  z.object({
    type: z.literal("theory"),
    value: z.string().min(1, "Value is required"),
  }),
  z.object({
    type: z.literal("code"),
    value: z.string().min(1, "Value is required"),
    language: z.string().optional().default("python"),
    solution: z.array(z.string()).optional().default([]),
  }),
  z.object({
    type: z.literal("mcq"),
    value: z.string().min(1, "Value is required"),
    choices: z.array(z.string()).optional().default([]),
    answer: z.number().optional().default(0),
  }),
]);

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  concept: z.string().min(1, "Concept is required"),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  description: z.string().min(1, "Description is required"),
  content: z.array(contentSchema),
});

type FormValues = z.infer<typeof formSchema>;

// Helper function to get CodeMirror language extension
function getLanguageExtension(language: string) {
  switch (language?.toLowerCase()) {
    case 'python':
    case 'py':
      return python();
    case 'javascript':
    case 'js':
    case 'jsx':
      return javascript({ jsx: true });
    case 'typescript':
    case 'ts':
    case 'tsx':
      return javascript({ typescript: true, jsx: true });
    case 'html':
    case 'htm':
      return html();
    case 'css':
      return css();
    case 'java':
      return java();
    case 'cpp':
    case 'c++':
    case 'c':
      return cpp();
    case 'php':
      return php();
    case 'rust':
    case 'rs':
      return rust();
    case 'go':
      return go();
    case 'sql':
      return sql();
    case 'json':
      return json();
    case 'xml':
      return xml();
    case 'markdown':
    case 'md':
      return markdown();
    default:
      return python(); // Default fallback
  }
}

export default function CreateDrillPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareToComm, setShareToCommunity] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      concept: "",
      difficulty: "Beginner",
      description: "",
      content: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "content",
  });

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    console.log('Starting AI generation with prompt:', aiPrompt);
    try {
        const result = await generateDrillAction(aiPrompt);
        console.log('AI generation result:', result);
        if (result.error) {
            throw new Error(result.error);
        }
        form.reset(result);
        toast({
            title: "Success",
            description: "Drill generated successfully!",
        });
    } catch (error) {
        console.error('AI generation error:', error);
        toast({
            title: "Error",
            description: `Failed to generate drill: ${error.message}`,
            variant: "destructive",
        });
    }
    setIsGenerating(false);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    console.log('Form submission started with values:', values);
    const user = auth.currentUser;

    if (!user) {
      console.log('No user logged in');
      toast({
        title: "Error",
        description: "You must be logged in to create a drill.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    console.log('User authenticated:', user.uid);

    try {
      // Validate content before processing
      if (!values.content || values.content.length === 0) {
        throw new Error('At least one content item is required');
      }

      const drillContent = values.content.map(content => {
          if (content.type === 'code') {
            const blankCount = content.value.split('____').length - 1;
            return {
              ...content,
              blanks: blankCount,
              // Ensure solution array matches blank count
              solution: content.solution || Array(blankCount).fill(''),
            };
          }
          return content;
      });

      console.log('Processed drill content:', drillContent);

      // Save to personal drills
      const docRef = await addDoc(collection(db, "drills"), {
        title: values.title,
        concept: values.concept,
        difficulty: values.difficulty,
        description: values.description,
        userId: user.uid,
        drill_content: drillContent,
        createdAt: new Date(),
      });

      // If sharing to community, also save to community collection
      if (shareToComm) {
        // Get user profile for author info
        const userProfileDoc = await getDoc(doc(db, 'users', user.uid));
        const userProfile = userProfileDoc.exists() ? userProfileDoc.data() : null;
        
        // Determine the primary language from the drill content
        const codeContent = drillContent.find(content => content.type === 'code');
        const primaryLanguage = codeContent?.language || 'python';
        
        await addDoc(collection(db, "community_drills"), {
          title: values.title,
          concept: values.concept,
          difficulty: values.difficulty,
          description: values.description,
          language: primaryLanguage,
          content: drillContent,
          authorId: user.uid,
          authorName: userProfile?.nickname || user.displayName || user.email?.split('@')[0] || 'Anonymous',
          authorAvatar: userProfile?.avatarUrl || user.photoURL || '',
          createdAt: new Date(),
          likes: 0,
          comments: 0,
          saves: 0,
          views: 0,
          tags: [values.concept.toLowerCase(), primaryLanguage.toLowerCase(), values.difficulty.toLowerCase()],
          isPublic: true,
          likedBy: [],
          savedBy: []
        });
      }

      console.log('Drill saved with ID:', docRef.id);

      toast({
        title: "Success",
        description: "Drill created successfully!",
      });
      router.push('/drills');
    } catch (error: any) {
      console.error('Error creating drill:', error);
      toast({
        title: "Error",
        description: `Failed to create drill: ${error?.message || 'Unknown error occurred'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto p-6">
        {/* API Key Status */}
        <div className="mb-6">
          <ApiKeyStatus showDetails={true} />
        </div>

        <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold font-code7x5 flex items-center">
                <Sparkles className="mr-3 h-6 w-6 text-primary" />
                Create with AI
            </h2>
            <div className="flex space-x-2">
                <Textarea 
                    placeholder="e.g., A simple linear regression model in Python"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                />
                <Button onClick={handleAiGenerate} disabled={isGenerating}>
                    {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Generate"}
                </Button>
            </div>
        </div>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter drill title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="concept"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Concept</FormLabel>
              <FormControl>
                <Input placeholder="Enter concept" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficulty</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a difficulty" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contextual Help Section */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Need Help?</h4>
          <DrillCreationHelp />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a brief description of the drill"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div>
          <h3 className="text-lg font-medium font-code7x5">Content</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md">
                {field.type === "theory" && (
                  <TheoryContentControl form={form} index={index} />
                )}
                {field.type === "code" && (
                  <CodeContentControl form={form} index={index} />
                )}
                {field.type === "mcq" && (
                  <McqContentControl form={form} index={index} />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => remove(index)}
                  className="mt-4"
                >
                  Remove Content
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ type: "theory", value: "" })}
          >
            Add Theory
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({
                type: "code",
                value: "",
                language: "python",
                solution: [],
              })
            }
          >
            Add Code
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ type: "mcq", value: "", choices: [""], answer: 0 })
            }
          >
            Add MCQ
          </Button>
        </div>

        {/* Community Sharing Option */}
        <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/50">
          <Checkbox
            id="shareToComm"
            checked={shareToComm}
            onCheckedChange={setShareToCommunity}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="shareToComm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Share with Community
            </label>
            <p className="text-xs text-muted-foreground">
              Make this drill available for other users to discover and practice
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            onClick={() => {
              console.log('Button clicked!');
              console.log('Form state:', form.formState);
              console.log('Form errors:', form.formState.errors);
              console.log('Detailed content errors:', form.formState.errors.content);
              console.log('Form values:', form.getValues());
              console.log('Content array:', form.getValues().content);
            }}
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : null}
            {isSubmitting ? "Creating..." : "Create Drill"}
          </Button>
          
          <Button 
            type="button"
            variant="outline"
            onClick={() => {
              console.log('Force submit clicked!');
              const values = form.getValues();
              onSubmit(values);
            }}
            disabled={isSubmitting}
          >
            Force Submit (Debug)
          </Button>
        </div>
      </form>
    </Form>
    </div>
  );
}

function TheoryContentControl({
  form,
  index,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
}) {
  return (
    <FormField
      control={form.control}
      name={`content.${index}.value`}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Theory</FormLabel>
          <FormControl>
            <Textarea placeholder="Enter theory text" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CodeContentControl({
  form,
  index,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `content.${index}.solution`,
  });

  const currentLanguage = form.watch(`content.${index}.language`) || 'python';
  const currentCode = form.watch(`content.${index}.value`) || '';
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`content.${index}.language`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Programming Language</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="cpp">C++</SelectItem>
                <SelectItem value="c">C</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
                <SelectItem value="php">PHP</SelectItem>
                <SelectItem value="rust">Rust</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="sql">SQL</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xml">XML</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name={`content.${index}.value`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Code</FormLabel>
            <FormControl>
              <CodeMirror
                value={field.value}
                height="200px"
                extensions={[getLanguageExtension(currentLanguage)]}
                theme={vscodeDark}
                onChange={(value) => field.onChange(value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Live Code Preview */}
      <div className="border rounded-lg p-4 bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Live Preview</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        </div>
        {showPreview && currentCode && (
          <LiveCodeBlock
            code={currentCode}
            language={currentLanguage}
            showLineNumbers={true}
            editable={false}
          />
        )}
      </div>
      
      <div>
        <FormLabel>Solutions</FormLabel>
        <div className="space-y-2">
          {fields.map((field, solutionIndex) => (
            <div key={field.id} className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name={`content.${index}.solution.${solutionIndex}`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        placeholder={`Solution for blank ${solutionIndex + 1}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(solutionIndex)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => append("")}
        >
          Add Solution
        </Button>
      </div>
    </div>
  );
}

function McqContentControl({
  form,
  index,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
}) {
  const {
    fields: choiceFields,
    append: appendChoice,
    remove: removeChoice,
  } = useFieldArray({
    control: form.control,
    name: `content.${index}.choices`,
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`content.${index}.value`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Question</FormLabel>
            <FormControl>
              <Textarea placeholder="Enter question" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FormLabel>Choices</FormLabel>
        <div className="space-y-2">
          {choiceFields.map((field, choiceIndex) => (
            <div key={field.id} className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name={`content.${index}.choices.${choiceIndex}`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <Input
                        placeholder={`Choice ${choiceIndex + 1}`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeChoice(choiceIndex)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => appendChoice("")}
        >
          Add Choice
        </Button>
      </div>
      <FormField
        control={form.control}
        name={`content.${index}.answer`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Correct Answer Index</FormLabel>
            <FormControl>
              <Input
                type="number"
                placeholder="Correct answer index"
                {...field}
                onChange={(event) => field.onChange(+event.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
