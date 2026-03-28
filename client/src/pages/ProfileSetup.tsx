import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { User, Camera, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ProfileSetup() {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const profileQuery = trpc.profiles.get.useQuery(
    { userId: user?.id },
    { enabled: !!user }
  );
  const profile = profileQuery.data;

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    avatarUrl: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        bio: profile.bio ?? "",
        avatarUrl: profile.avatarUrl ?? "",
      });
    } else if (user) {
      setForm((p) => ({ ...p, displayName: user.name ?? "" }));
    }
  }, [profile, user]);

  const uploadAvatarMutation = trpc.profiles.uploadAvatar.useMutation();
  const upsertMutation = trpc.profiles.upsert.useMutation({
    onSuccess: () => {
      profileQuery.refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profile saved!");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAvatarChange = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const base64Reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        base64Reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result.split(",")[1]);
        };
        base64Reader.readAsDataURL(file);
      });
      const { url } = await uploadAvatarMutation.mutateAsync({
        base64,
        mimeType: file.type,
      });
      setForm((p) => ({ ...p, avatarUrl: url }));
      toast.success("Avatar uploaded!");
    } catch (e: any) {
      toast.error(e.message || "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    upsertMutation.mutate({
      displayName: form.displayName.trim() || undefined,
      bio: form.bio.trim() || undefined,
      avatarUrl: form.avatarUrl || undefined,
      profileComplete: !!(form.displayName.trim()),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Sign in to set up your profile</h2>
          <Button
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const displayName = form.displayName || user?.name || "Creator";
  const avatarSrc = avatarPreview || form.avatarUrl || undefined;

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Your Profile
          </h1>
          <p className="text-muted-foreground">
            Set up your creator identity on Strawberry Riff
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Creator Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-pink-100 shadow-lg">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-2xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])}
                />
              </div>
              <p className="text-xs text-muted-foreground">Click the camera icon to upload a photo</p>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Your artist or creator name"
                className="mt-1"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is how other users will see you
              </p>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell the community about yourself and your music..."
                className="mt-1 resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.bio.length}/500 characters
              </p>
            </div>

            {/* Account Info (read-only) */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Info</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="text-gray-700 font-medium">{user?.email || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Member since</span>
                <span className="text-gray-700 font-medium">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 py-5"
              size="lg"
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Saved!
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
