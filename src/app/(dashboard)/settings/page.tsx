
"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  UserRound,
  Mail,
  ImagePlus,
  Save,
  Loader2,
  ShieldCheck,
  Settings2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function SettingsPage() {
  const {
    data: session,
    isPending,
    refetch,
  } = authClient.useSession();

  const user = session?.user;

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setImage(user.image || "");
    }
  }, [user?.id, user?.name, user?.image]);

  const hasChanges =
    name.trim() !== (user?.name || "") ||
    image.trim() !== (user?.image || "");

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || saving) return;

    setError("");
    setSuccess("");

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (image.trim()) {
      try {
        const url = new URL(image.trim());

        if (!["https:", "http:"].includes(url.protocol)) {
          throw new Error("Invalid image URL");
        }
      } catch {
        setError("Please enter a valid image URL.");
        return;
      }
    }

    try {
      setSaving(true);

      const result = await authClient.updateUser({
        name: name.trim(),
        image: image.trim() || null,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Failed to update profile"
        );
      }

      await refetch();

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-teal-600" />
          <p className="mt-4 text-sm text-slate-500">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <AlertCircle className="text-red-500" size={36} />
        <h2 className="text-lg font-semibold text-slate-900">
          Authentication Required
        </h2>
        <p className="text-sm text-slate-500">
          Please sign in to access your settings.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-10">
      {/* Header */}
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-600">
          <Settings2 size={18} />
          Account Preferences
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Profile Summary */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <div className="h-24 bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500" />

        <CardContent className="-mt-10 px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-teal-100 text-2xl font-bold text-teal-700 shadow-sm">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase() || "U"
              )}
            </div>

            <div className="flex-1 sm:pb-1">
              <h2 className="text-xl font-bold text-slate-900">
                {user.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {user.email}
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
              <ShieldCheck size={14} />
              Account Active
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-600">
              <UserRound size={22} />
            </div>

            <div>
              <CardTitle className="text-lg">
                Personal Information
              </CardTitle>

              <CardDescription className="mt-1">
                Update your profile details and public image.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setSuccess("");
                    }}
                    placeholder="Enter your full name"
                    className="h-11 pl-10"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    readOnly
                    className="h-11 bg-slate-50 pl-10 text-slate-500"
                  />
                </div>

                <p className="text-xs text-slate-400">
                  Email changes are not available here.
                </p>
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image">
                Profile Image URL
              </Label>

              <div className="relative">
                <ImagePlus
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <Input
                  id="image"
                  type="url"
                  value={image}
                  onChange={(event) => {
                    setImage(event.target.value);
                    setSuccess("");
                  }}
                  placeholder="https://example.com/profile.jpg"
                  className="h-11 pl-10"
                />
              </div>

              <p className="text-xs text-slate-400">
                Paste a publicly accessible image URL.
              </p>
            </div>

            {/* Image Preview */}
            {image.trim() && (
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-100 text-teal-700">
                  <img
                    src={image.trim()}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Profile Preview
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    This image will appear on your account.
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600"
              >
                <AlertCircle size={17} />
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700"
              >
                <CheckCircle2 size={17} />
                {success}
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-5">
              <Button
                type="submit"
                disabled={saving || !hasChanges}
                className="gap-2 bg-teal-600 px-6 text-white hover:bg-teal-700"
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck size={20} className="text-teal-600" />
            Account Information
          </CardTitle>

          <CardDescription>
            Your account details and security information.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Account ID
            </p>
            <p className="mt-2 break-all text-sm font-medium text-slate-800">
              {user.id}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-slate-500">
              Email Verification
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-800">
              {user.emailVerified
                ? "Verified"
                : "Not Verified"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
