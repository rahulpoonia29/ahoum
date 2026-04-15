import { useAuth } from "~/lib/auth"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { Button } from "~/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Spinner } from "~/components/ui/spinner"
import { AlertCircle, Code, ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Label } from "~/components/ui/label"

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ""

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [role, setRole] = useState<"USER" | "CREATOR" | null>(null)

  // Get REDIRECT_URI from window (only available in browser)
  const REDIRECT_URI =
    typeof window !== "undefined" ? `${window.location.origin}/login` : ""

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code")
    const provider = searchParams.get("provider") as "github" | "google" | null
    const selectedRole = searchParams.get("role") as "USER" | "CREATOR" | null

    if (code && provider && REDIRECT_URI) {
      const handleCallback = async () => {
        try {
          setIsProcessing(true)
          await login(code, REDIRECT_URI, provider, selectedRole || undefined)
          navigate("/dashboard")
        } catch (err) {
          const message = err instanceof Error ? err.message : "Login failed"
          setError(message)
          setIsProcessing(false)
        }
      }

      handleCallback()
    }
  }, [searchParams, login, navigate, REDIRECT_URI])

  // Redirect if already authenticated
  if (isAuthenticated && !isProcessing) {
    navigate("/dashboard")
    return null
  }

  const handleGitHubLogin = () => {
    if (!role) {
      setError("Please select a role before continuing")
      return
    }

    const url = new URL("https://github.com/login/oauth/authorize")
    url.searchParams.set("client_id", GITHUB_CLIENT_ID)
    url.searchParams.set("redirect_uri", `${REDIRECT_URI}?provider=github&role=${role}`)
    url.searchParams.set("scope", "user:email")
    window.location.href = url.toString()
  }

  if (isProcessing) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border">
          <CardContent className="flex flex-col items-center justify-center gap-4 pt-8">
            <Spinner />
            <p className="text-sm text-muted-foreground">Authenticating your account...</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-sm border">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Welcome to Ahoum</CardTitle>
          <CardDescription>
            Sign in with GitHub to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!GITHUB_CLIENT_ID && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                GitHub OAuth configuration missing. Please check your environment variables.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">
              How would you like to join?
            </Label>
            <Select value={role || ""} onValueChange={(value) => setRole(value as "USER" | "CREATOR")}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">
                  <span className="font-medium">Viewer</span>
                  <span className="text-sm text-muted-foreground"> - Book and attend sessions</span>
                </SelectItem>
                <SelectItem value="CREATOR">
                  <span className="font-medium">Creator</span>
                  <span className="text-sm text-muted-foreground"> - Share your expertise</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground/70">
              You can change your role anytime in settings
            </p>
          </div>

          <Button
            onClick={handleGitHubLogin}
            disabled={!GITHUB_CLIENT_ID || isProcessing || !role}
            className="w-full"
            size="lg"
          >
            <Code className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
