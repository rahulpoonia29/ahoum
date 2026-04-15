import { useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "~/lib/auth"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, Mail, Lock, User, ArrowRight, Code } from "lucide-react"
import { ApiError } from "~/lib/api"

type SignupStep = "role" | "details"

export default function Signup() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [step, setStep] = useState<SignupStep>("role")
  const [role, setRole] = useState<"USER" | "CREATOR" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    creator_code: "",
  })

  const handleRoleSelect = (selectedRole: "USER" | "CREATOR") => {
    setRole(selectedRole)
    setStep("details")
    setError(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!role) {
        setError("Role not selected")
        return
      }

      if (!formData.username || !formData.email || !formData.password) {
        setError("Username, email, and password are required")
        return
      }

      if (role === "CREATOR" && !formData.creator_code) {
        setError("Creator code is required")
        return
      }

      await register({
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        role,
        ...(role === "CREATOR" && { creator_code: formData.creator_code }),
      })

      navigate("/dashboard")
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Signup failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Step 1: Role Selection */}
        {step === "role" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Join Ahoum</h1>
              <p className="text-muted-foreground">Choose how you want to get started</p>
            </div>

            <div className="grid gap-4">
              {/* Viewer Option */}
              <button
                onClick={() => handleRoleSelect("USER")}
                className="group relative overflow-hidden rounded-xl border-2 border-border bg-card/50 p-6 transition-all hover:border-primary hover:bg-card"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 transition-opacity group-hover:opacity-5" />
                <div className="relative space-y-3">
                   <div className="inline-flex rounded-lg bg-primary/10 p-3">
                     <User className="h-6 w-6 text-primary" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-semibold text-foreground">Join as Viewer</h3>
                     <p className="text-sm text-muted-foreground mt-1">
                       Book sessions and learn from creators
                     </p>
                   </div>
                 </div>
              </button>

              {/* Creator Option */}
              <button
                onClick={() => handleRoleSelect("CREATOR")}
                className="group relative overflow-hidden rounded-xl border-2 border-border bg-card/50 p-6 transition-all hover:border-primary hover:bg-card"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary opacity-0 transition-opacity group-hover:opacity-5" />
                <div className="relative space-y-3">
                   <div className="inline-flex rounded-lg bg-primary/10 p-3">
                     <Code className="h-6 w-6 text-primary" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-semibold text-foreground">Become a Creator</h3>
                     <p className="text-sm text-muted-foreground mt-1">
                       Share your expertise and earn
                     </p>
                   </div>
                 </div>
              </button>
            </div>

            <div className="text-center">
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Registration Details */}
        {step === "details" && role && (
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <button
                  onClick={() => setStep("role")}
                  className="inline-flex items-center justify-center rounded-lg p-1 hover:bg-muted transition-colors"
                  type="button"
                >
                  <ArrowRight className="h-5 w-5 text-muted-foreground rotate-180" />
                </button>
                Sign up as {role === "CREATOR" ? "Creator" : "Viewer"}
              </CardTitle>
              <CardDescription>
                {role === "CREATOR"
                  ? "Share your knowledge with the community"
                  : "Start learning from expert creators"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                   <Alert variant="destructive">
                     <AlertCircle className="h-4 w-4" />
                     <AlertDescription>{error}</AlertDescription>
                   </Alert>
                 )}

                 <div className="grid gap-2">
                   <Label htmlFor="username" className="text-foreground">
                     Username
                   </Label>
                   <Input
                     id="username"
                     name="username"
                     type="text"
                     placeholder="your_username"
                     value={formData.username}
                     onChange={handleInputChange}
                     required
                   />
                 </div>

                 <div className="grid gap-2">
                   <Label htmlFor="email" className="text-foreground">
                     Email
                   </Label>
                   <Input
                     id="email"
                     name="email"
                     type="email"
                     placeholder="you@example.com"
                     value={formData.email}
                     onChange={handleInputChange}
                     required
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div className="grid gap-2">
                     <Label htmlFor="first_name" className="text-foreground">
                       First Name
                     </Label>
                     <Input
                       id="first_name"
                       name="first_name"
                       type="text"
                       placeholder="John"
                       value={formData.first_name}
                       onChange={handleInputChange}
                     />
                   </div>
                   <div className="grid gap-2">
                     <Label htmlFor="last_name" className="text-foreground">
                       Last Name
                     </Label>
                     <Input
                       id="last_name"
                       name="last_name"
                       type="text"
                       placeholder="Doe"
                       value={formData.last_name}
                       onChange={handleInputChange}
                     />
                   </div>
                 </div>

                 <div className="grid gap-2">
                   <Label htmlFor="password" className="text-foreground">
                     Password
                   </Label>
                   <Input
                     id="password"
                     name="password"
                     type="password"
                     placeholder="••••••••"
                     value={formData.password}
                     onChange={handleInputChange}
                     required
                   />
                 </div>

                 {role === "CREATOR" && (
                   <div className="grid gap-2">
                     <Label htmlFor="creator_code" className="text-foreground">
                       Creator Code
                     </Label>
                     <Input
                       id="creator_code"
                       name="creator_code"
                       type="password"
                       placeholder="Enter creator code"
                       value={formData.creator_code}
                       onChange={handleInputChange}
                       required
                     />
                     <p className="text-xs text-muted-foreground/70">
                       Contact admin for creator access code
                     </p>
                   </div>
                 )}

                 <Button
                   type="submit"
                   className="w-full"
                   disabled={isLoading}
                 >
                   {isLoading ? "Creating account..." : "Create Account"}
                 </Button>

                 <p className="text-center text-muted-foreground text-sm">
                   Already have an account?{" "}
                   <button
                     onClick={() => navigate("/login")}
                     className="text-primary hover:text-primary/80 font-medium"
                     type="button"
                   >
                     Sign in
                   </button>
                 </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
