import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "~/lib/auth"
import { api } from "~/lib/api"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Spinner } from "~/components/ui/spinner"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, CheckCircle, Upload, Camera, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Separator } from "~/components/ui/separator"

export default function ProfilePage() {
  const navigate = useNavigate()
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    refreshUser,
  } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login")
    }
  }, [isAuthenticated, authLoading, navigate])

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        bio: user.bio || "",
      })
      if (user.avatar) {
        setAvatarPreview(user.avatar)
      }
    }
  }, [user])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("first_name", formData.first_name)
      formDataToSend.append("last_name", formData.last_name)
      formDataToSend.append("bio", formData.bio)

      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile)
      }

      const token = api.getToken()
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/users/me/`,
        {
          method: "PATCH",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formDataToSend,
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      await refreshUser()
      setSuccess(true)
      setAvatarFile(null)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Profile Settings
          </h1>
          <p className="mt-2 text-muted-foreground">Manage your account information</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border bg-muted">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-muted-foreground">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Picture
              </CardTitle>
              <CardDescription>Update your avatar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-end gap-6">
                 <div className="flex-shrink-0">
                   <Avatar className="h-24 w-24">
                     <AvatarImage src={avatarPreview || undefined} alt="Avatar preview" />
                     <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                       {getInitials(formData.first_name || user?.username)}
                     </AvatarFallback>
                   </Avatar>
                 </div>

                <div className="flex-1">
                  <Label htmlFor="avatar" className="mb-3 block font-medium">
                    Choose new picture
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="cursor-pointer flex-1"
                    />
                    {avatarFile && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setAvatarFile(null)
                          setAvatarPreview(user?.avatar || null)
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                   <p className="mt-2 text-xs text-muted-foreground/70">
                     JPG, PNG or GIF. Max 5MB.
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="first_name" className="mb-2 block">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="mb-2 block">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="mb-2 block">
                  Email Address
                </Label>
                <Input
                   id="email"
                   type="email"
                   value={formData.email}
                   disabled
                   className="bg-muted cursor-not-allowed"
                 />
                 <p className="mt-2 text-xs text-muted-foreground/70">
                   Email is linked to your OAuth account and cannot be changed.
                 </p>
              </div>

              <div>
                <Label htmlFor="bio" className="mb-2 block">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself or your expertise..."
                  rows={4}
                  className="resize-none"
                />
                 <p className="mt-2 text-xs text-muted-foreground/70">
                   Brief description about you (max 500 characters).
                 </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <p className="mb-1 text-sm font-medium text-foreground">
                   Username
                 </p>
                 <p className="text-sm text-muted-foreground font-mono">{user?.username}</p>
               </div>
               <Separator />
               <div>
                 <p className="mb-1 text-sm font-medium text-foreground">Role</p>
                 <p className="text-sm text-muted-foreground capitalize">
                   {user?.role === "CREATOR" ? "Creator" : "User"}
                 </p>
               </div>
               <Separator />
               <div>
                 <p className="mb-1 text-sm font-medium text-foreground">
                   Auth Provider
                 </p>
                 <p className="text-sm text-muted-foreground capitalize">
                   {user?.auth_provider || "Not specified"}
                 </p>
               </div>
             </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
