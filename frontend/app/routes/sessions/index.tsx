import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useSessions } from "~/lib/hooks"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Spinner } from "~/components/ui/spinner"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, Search, Calendar, Users, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { isSessionPopulated, formatPrice } from "~/lib/types"

type SortOption = "newest" | "oldest" | "price-low" | "price-high"

export default function SessionsPage() {
  const navigate = useNavigate()
  const { sessions, isLoading, error, fetchSessions } = useSessions()

  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [filteredSessions, setFilteredSessions] = useState(sessions)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    let filtered = sessions.filter((session) => {
      if (!session || !isSessionPopulated(session)) return false

      const searchLower = searchTerm.toLowerCase()
      return (
        session.title.toLowerCase().includes(searchLower) ||
        session.description.toLowerCase().includes(searchLower) ||
        session.creator?.first_name?.toLowerCase().includes(searchLower) ||
        session.creator?.username?.toLowerCase().includes(searchLower)
      )
    })

    // Sort filtered sessions
    filtered = [...filtered].sort((a, b) => {
      if (!isSessionPopulated(a) || !isSessionPopulated(b)) return 0

      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price)
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price)
        default:
          return 0
      }
    })

    setFilteredSessions(filtered)
  }, [sessions, searchTerm, sortBy])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Sessions</h1>
          <p className="mt-2 text-muted-foreground">
            Discover and book sessions from expert instructors
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by title, topic, or creator..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium mb-2">Sort by</label>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : filteredSessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {sessions.length === 0 ? "No sessions available" : "No sessions match your search"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {sessions.length === 0
                  ? "Check back later for new sessions"
                  : "Try adjusting your search filters"}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredSessions.length} of {sessions.length} session
              {filteredSessions.length !== 1 ? "s" : ""}
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session) => {
                if (!session || !isSessionPopulated(session)) return null

                const startTime = getSessionTime(session)
                const creator = getSessionCreator(session)

                return (
                  <Card
                    key={session.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    {session.cover_image && (
                      <div className="h-40 overflow-hidden bg-muted relative">
                        <img
                          src={session.cover_image}
                          alt={session.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2">{session.title}</CardTitle>
                        <Badge variant="secondary" className="shrink-0 text-sm">
                          {formatPrice(session.price)}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">
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
                          <span>{session.max_participants} max participants</span>
                        </div>
                      </div>

                      <Button
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/sessions/${session.id}`)
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
      </div>
    </main>
  )
}
