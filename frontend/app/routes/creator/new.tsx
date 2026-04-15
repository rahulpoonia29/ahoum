import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "~/lib/auth"
import { useSessions } from "~/lib/hooks"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { Spinner } from "~/components/ui/spinner"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, Upload, ArrowLeft, Clock, Users, DollarSign, Image } from "lucide-react"
import { Separator } from "~/components/ui/separator"

export default function CreateSessionPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { createSession, isLoading } = useSessions()

  const [error, setError] = useState<string | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    start_time: "",
    end_time: "",
    max_participants: "1",
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </main>
    )
  }

  if (!isAuthenticated || user?.role !== "CREATOR") {
    navigate("/login")
    return null
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB")
        return
      }
      setCoverImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = "Session title is required"
    } else if (formData.title.length > 200) {
      errors.title = "Title must be less than 200 characters"
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required"
    } else if (formData.description.length < 20) {
      errors.description = "Description must be at least 20 characters"
    }

    if (!formData.price) {
      errors.price = "Price is required"
    } else if (parseFloat(formData.price) < 0) {
      errors.price = "Price cannot be negative"
    } else if (parseFloat(formData.price) === 0) {
      errors.price = "Price must be greater than 0"
    }

    if (!formData.start_time) {
      errors.start_time = "Start time is required"
    }

    if (!formData.end_time) {
      errors.end_time = "End time is required"
    }

    if (formData.start_time && formData.end_time) {
      const startDate = new Date(formData.start_time)
      const endDate = new Date(formData.end_time)
      if (startDate >= endDate) {
        errors.end_time = "End time must be after start time"
      }
      if (startDate < new Date()) {
        errors.start_time = "Start time cannot be in the past"
      }
    }

    if (!formData.max_participants) {
      errors.max_participants = "Max participants is required"
    } else if (parseInt(formData.max_participants) < 1) {
      errors.max_participants = "Must have at least 1 participant"
    } else if (parseInt(formData.max_participants) > 1000) {
      errors.max_participants = "Max participants cannot exceed 1000"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    try {
      await createSession({
        title: formData.title,
        description: formData.description,
        price: formData.price,
        start_time: formData.start_time,
        end_time: formData.end_time,
        max_participants: parseInt(formData.max_participants),
        cover_image: coverImageFile || undefined,
      })

      navigate("/creator")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create session"
      setError(message)
    }
  }

  const calculateDuration = () => {
    if (!formData.start_time || !formData.end_time) return null
    const start = new Date(formData.start_time)
    const end = new Date(formData.end_time)
    const minutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate("/creator")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creator Dashboard
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create New Session</h1>
          <p className="mt-2 text-muted-foreground">Share your expertise and start earning by creating a session</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Cover Image
              </CardTitle>
              <CardDescription>Upload an image to represent your session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 {coverImagePreview && (
                   <div className="relative h-48 rounded-lg overflow-hidden bg-muted">
                     <img
                       src={coverImagePreview}
                       alt="Cover preview"
                       className="h-full w-full object-cover"
                     />
                     <Button
                       type="button"
                       variant="outline"
                       size="sm"
                       className="absolute top-2 right-2"
                       onClick={() => {
                         setCoverImageFile(null)
                         setCoverImagePreview(null)
                       }}
                     >
                       Remove
                     </Button>
                   </div>
                 )}
                 {!coverImagePreview && (
                   <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                     <Upload className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                     <p className="text-sm text-muted-foreground">Drag and drop your image here or click to browse</p>
                   </div>
                 )}
                 <div>
                   <Label htmlFor="cover_image" className="mb-2 block">
                     Choose Image
                   </Label>
                   <Input
                     id="cover_image"
                     type="file"
                     accept="image/*"
                     onChange={handleCoverImageChange}
                     className="cursor-pointer"
                   />
                   <p className="mt-2 text-xs text-muted-foreground/70">
                     JPG, PNG or GIF. Max 5MB. (Optional)
                   </p>
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Create an engaging title and description for your session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" className="mb-2 block">
                  Session Title *
                </Label>
                <Input
                   id="title"
                   name="title"
                   value={formData.title}
                   onChange={handleInputChange}
                   placeholder="e.g., Introduction to Web Design"
                   className={validationErrors.title ? "border-destructive" : ""}
                 />
                 {validationErrors.title && (
                   <p className="text-xs text-destructive mt-1">{validationErrors.title}</p>
                 )}
              </div>

              <div>
                <Label htmlFor="description" className="mb-2 block">
                  Description *
                </Label>
                <Textarea
                   id="description"
                   name="description"
                   value={formData.description}
                   onChange={handleInputChange}
                   placeholder="Describe what attendees will learn in this session..."
                   rows={5}
                   className={validationErrors.description ? "border-destructive" : ""}
                 />
                 {validationErrors.description && (
                   <p className="text-xs text-destructive mt-1">{validationErrors.description}</p>
                 )}
                 <p className="text-xs text-muted-foreground/70 mt-2">
                   {formData.description.length} characters
                 </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="price" className="mb-2 block flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Price ($) *
                  </Label>
                  <Input
                     id="price"
                     name="price"
                     type="number"
                     step="0.01"
                     min="0"
                     value={formData.price}
                     onChange={handleInputChange}
                     placeholder="99.99"
                     className={validationErrors.price ? "border-destructive" : ""}
                   />
                   {validationErrors.price && (
                     <p className="text-xs text-destructive mt-1">{validationErrors.price}</p>
                   )}
                </div>

                <div>
                  <Label htmlFor="max_participants" className="mb-2 block flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Max Participants *
                  </Label>
                  <Input
                     id="max_participants"
                     name="max_participants"
                     type="number"
                     min="1"
                     max="1000"
                     value={formData.max_participants}
                     onChange={handleInputChange}
                     className={validationErrors.max_participants ? "border-destructive" : ""}
                   />
                   {validationErrors.max_participants && (
                     <p className="text-xs text-destructive mt-1">{validationErrors.max_participants}</p>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule
              </CardTitle>
              <CardDescription>Set when your session will take place</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                   <Label htmlFor="start_time" className="mb-2 block">
                     Start Time *
                   </Label>
                   <Input
                     id="start_time"
                     name="start_time"
                     type="datetime-local"
                     value={formData.start_time}
                     onChange={handleInputChange}
                     className={validationErrors.start_time ? "border-destructive" : ""}
                   />
                   {validationErrors.start_time && (
                     <p className="text-xs text-destructive mt-1">{validationErrors.start_time}</p>
                   )}
                 </div>

                 <div>
                   <Label htmlFor="end_time" className="mb-2 block">
                     End Time *
                   </Label>
                   <Input
                     id="end_time"
                     name="end_time"
                     type="datetime-local"
                     value={formData.end_time}
                     onChange={handleInputChange}
                     className={validationErrors.end_time ? "border-destructive" : ""}
                   />
                   {validationErrors.end_time && (
                     <p className="text-xs text-destructive mt-1">{validationErrors.end_time}</p>
                   )}
                 </div>
              </div>

              {calculateDuration() && (
                 <div className="rounded-lg bg-muted border p-3">
                   <p className="text-sm text-muted-foreground">
                     <strong>Duration:</strong> {calculateDuration()}
                   </p>
                 </div>
               )}
            </CardContent>
          </Card>

          <Separator />

          {/* Summary */}
           {formData.title && formData.price && (
             <Card className="bg-muted border">
               <CardContent className="pt-6">
                 <h3 className="font-semibold text-foreground mb-3">Session Summary</h3>
                 <div className="space-y-2 text-sm text-muted-foreground">
                   <p>
                     <strong>Title:</strong> {formData.title}
                   </p>
                   <p>
                     <strong>Price:</strong> ${parseFloat(formData.price || "0").toFixed(2)}
                   </p>
                   <p>
                     <strong>Max Participants:</strong> {formData.max_participants}
                   </p>
                   {calculateDuration() && (
                     <p>
                       <strong>Duration:</strong> {calculateDuration()}
                     </p>
                   )}
                 </div>
               </CardContent>
             </Card>
           )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/creator")}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                "Create Session"
              )}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
