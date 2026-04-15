import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useSessions } from "~/lib/hooks"
import { useAuth } from "~/lib/auth"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { Spinner } from "~/components/ui/spinner"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, Search, Calendar, Users, DollarSign, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { isSessionPopulated, formatPrice } from "~/lib/types"

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { sessions, isLoading, error, fetchSessions } = useSessions()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      fetchSessions({ search: searchTerm })
    }
  }

  const handleSessionClick = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`)
  }

  // Safe getters
  const getSessionTime = (session: any) => {
    if (!session || !isSessionPopulated(session)) return null
    try {
      return new Date(session.start_time)
    } catch {
      return null
    }
  }

  const getSessionCreator = (session: any) => {
    if (!session || !isSessionPopulated(session)) return "Unknown"
    return session.creator?.first_name || session.creator?.username || "Unknown"
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Discover Amazing Sessions
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Learn from experts and book sessions that match your interests
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2 justify-center">
              <div className="w-full max-w-md relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions available</h3>
              <p className="text-muted-foreground mb-6">
                No sessions match your search. Try a different search term.
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    fetchSessions()
                  }}
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Featured Sessions</h2>
              <p className="text-muted-foreground">
                Showing {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => {
                if (!session || !isSessionPopulated(session)) return null

                const startTime = getSessionTime(session)
                const creator = getSessionCreator(session)

                return (
                  <Card
                    key={session.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleSessionClick(session.id)}
                  >
                    {session.cover_image && (
                      <div className="h-48 overflow-hidden bg-muted">
                        <img
                          src={session.cover_image}
                          alt={session.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2">{session.title}</CardTitle>
                        <Badge variant="secondary" className="shrink-0">
                          {formatPrice(session.price)}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        by {creator}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {session.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        {startTime && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(startTime, "MMM dd, yyyy")}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{session.max_participants} participants max</span>
                        </div>
                      </div>

                      <Button
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSessionClick(session.id)
                        }}
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA Section */}
        {!isAuthenticated && (
          <div className="mt-16 text-center">
            <Card className="border">
              <CardContent className="pt-8">
                <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
                <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                  Sign in to your account to book sessions and start learning
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/login")}
                >
                  Sign In to Book
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
