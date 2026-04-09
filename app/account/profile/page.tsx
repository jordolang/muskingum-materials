"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/account/profile");
        const data = await res.json();
        if (data.profile) {
          reset({
            name: data.profile.name || user?.fullName || "",
            email: data.profile.email || user?.primaryEmailAddress?.emailAddress || "",
            phone: data.profile.phone || "",
            company: data.profile.company || "",
          });
        } else if (user) {
          reset({
            name: user.fullName || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            phone: "",
            company: "",
          });
        }
      } catch {
        if (user) {
          reset({
            name: user.fullName || "",
            email: user.primaryEmailAddress?.emailAddress || "",
            phone: "",
            company: "",
          });
        }
      } finally {
        setLoading(false);
      }
    }
    if (isLoaded) loadProfile();
  }, [isLoaded, user, reset]);

  async function onSubmit(data: ProfileData) {
    setSaved(false);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  if (loading || !isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your contact information and preferences
        </p>
      </div>

      {/* Clerk Account Info */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-amber-600" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-14 w-14 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold">{user?.fullName || "User"}</p>
              <p className="text-sm text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Profile */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            This info is used to pre-fill your orders and for our team to contact you.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input placeholder="(740) 555-0123" {...register("phone")} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Company</label>
                <Input placeholder="Company name (optional)" {...register("company")} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Saved!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
