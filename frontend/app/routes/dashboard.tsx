import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "~/lib/auth"
import { useBookings } from "~/lib/hooks"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Spinner } from "~/components/ui/spinner"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, Calendar, Clock, MapPin, ArrowRight, Settings, BookOpen } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import {
  isSessionPopulated,
  getSessionId,
  formatPrice,
  getBookingStatusLabel,
  getBookingStatusColor,
  type Booking,
  type Session,
} from "~/lib/types"

export default function UserDashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { bookings, isLoading: bookingsLoading, error, fetchMyBookings } = useBookings()

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login")
    }
  }, [isAuthenticated, authLoading, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyBookings()
    }
  }, [isAuthenticated])

  if (authLoading || bookingsLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </main>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Safely extract session date with null checks
  const getSessionDate = (session: Session): Date | null => {
    if (isSessionPopulated(session)) {
      try {
        return new Date(session.start_time)
      } catch {
        return null
      }
    }
    return null
  }

  const upcomingBookings = bookings
    .filter((b) => {
      const sessionDate = getSessionDate(b.session)
      return sessionDate && sessionDate > new Date()
    })
    .sort((a, b) => {
      const dateA = getSessionDate(a.session)
      const dateB = getSessionDate(b.session)
      if (!dateA || !dateB) return 0
      return dateA.getTime() - dateB.getTime()
    })

  const pastBookings = bookings
    .filter((b) => {
      const sessionDate = getSessionDate(b.session)
      return !sessionDate || sessionDate <= new Date()
    })
    .sort((a, b) => {
      const dateA = getSessionDate(a.session)
      const dateB = getSessionDate(b.session)
      if (!dateA || !dateB) return 0
      return dateB.getTime() - dateA.getTime()
    })

  // Safe getters for session info
  const getSessionInfo = (session: Session | null | undefined) => {
    if (!session) {
      return { title: "Session", creator: "Unknown", price: "N/A" }
    }

    if (isSessionPopulated(session)) {
      return {
        title: session.title,
        creator: session.creator?.first_name || session.creator?.username || "Unknown",
        price: formatPrice(session.price),
      }
    }

    return { title: "Session", creator: "Unknown", price: "N/A" }
  }

  const getSessionStartTime = (session: Session | null | undefined): Date | null => {
    if (!session) return null
    if (isSessionPopulated(session)) {
      try {
        return new Date(session.start_time)
      } catch {
        return null
      }
    }
    return null
  }

  const getInitials = (name?: string | null): string => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getStatusBadge = (status: string | null | undefined) => {
    const validStatus = status as "PENDING" | "CONFIRMED" | "CANCELLED" | undefined

    switch (validStatus) {
      case "CONFIRMED":
        return <Badge variant="default">Confirmed</Badge>
      case "PENDING":
        return <Badge variant="secondary">Pending Payment</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>{validStatus || "Unknown"}</Badge>
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header with Profile */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user.avatar || undefined} alt={user.username} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {getInitials(user.first_name || user.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome back, {user.first_name || user.username}!
                </h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/profile")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
         <div className="mb-8 grid gap-4 sm:grid-cols-3">
           <Card>
             <CardContent className="pt-6">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                 <p className="text-3xl font-bold text-foreground mt-1">
                   {bookings?.length || 0}
                 </p>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardContent className="pt-6">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                 <p className="text-3xl font-bold text-primary mt-1">
                   {upcomingBookings?.length || 0}
                 </p>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardContent className="pt-6">
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Completed</p>
                 <p className="text-3xl font-bold text-foreground mt-1">
                   {pastBookings?.length || 0}
                 </p>
               </div>
             </CardContent>
           </Card>
         </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming ({upcomingBookings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Completed ({pastBookings?.length || 0})
            </TabsTrigger>
          </TabsList>

           <TabsContent value="upcoming" className="space-y-4">
             {!upcomingBookings || upcomingBookings.length === 0 ? (
               <Card className="border-dashed">
                 <CardContent className="pt-6 text-center">
                   <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                   <p className="text-muted-foreground mb-4 font-medium">No upcoming bookings</p>
                   <p className="text-sm text-muted-foreground/80 mb-4">
                     Explore sessions and book your first experience
                   </p>
                   <Button onClick={() => navigate("/sessions")}>
                     Browse Sessions
                   </Button>
                 </CardContent>
               </Card>
             ) : (
              upcomingBookings.map((booking) => {
                if (!booking) return null

                const sessionInfo = getSessionInfo(booking.session)
                const startTime = getSessionStartTime(booking.session)

                return (
                   <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                     <CardContent className="pt-6">
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                             <h3 className="font-semibold text-foreground text-lg">
                               {sessionInfo.title}
                             </h3>
                             {getStatusBadge(booking.status)}
                           </div>
                           <p className="text-sm text-muted-foreground mb-3">
                             with {sessionInfo.creator}
                           </p>
                           <div className="space-y-2 text-sm text-muted-foreground">
                             {startTime ? (
                               <>
                                 <div className="flex items-center gap-2">
                                   <Calendar className="h-4 w-4 text-muted-foreground/60" />
                                   <span>
                                     {format(startTime, "EEEE, MMMM dd, yyyy")}
                                   </span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <Clock className="h-4 w-4 text-muted-foreground/60" />
                                   <span>
                                     {format(startTime, "HH:mm")} · Starts{" "}
                                     {formatDistanceToNow(startTime, {
                                       addSuffix: true,
                                     })}
                                   </span>
                                 </div>
                               </>
                             ) : (
                               <p className="text-xs text-muted-foreground/60">Date information unavailable</p>
                             )}
                           </div>
                         </div>
                         <div className="text-right flex flex-col items-end gap-3">
                           <div className="text-2xl font-bold text-foreground">
                             {sessionInfo.price}
                           </div>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               const sessionId = getSessionId(booking.session)
                               navigate(`/sessions/${sessionId}`)
                             }}
                             className="gap-1"
                           >
                             View <ArrowRight className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                )
              })
            )}
          </TabsContent>

           <TabsContent value="past" className="space-y-4">
             {!pastBookings || pastBookings.length === 0 ? (
               <Card className="border-dashed">
                 <CardContent className="pt-6 text-center">
                   <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                   <p className="text-muted-foreground font-medium">No completed bookings yet</p>
                 </CardContent>
               </Card>
             ) : (
               pastBookings.map((booking) => {
                 if (!booking) return null

                 const sessionInfo = getSessionInfo(booking.session)
                 const startTime = getSessionStartTime(booking.session)

                 return (
                   <Card key={booking.id} className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                     <CardContent className="pt-6">
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex-1">
                           <h3 className="font-semibold text-foreground mb-1">
                             {sessionInfo.title}
                           </h3>
                           <p className="text-sm text-muted-foreground mb-2">
                             with {sessionInfo.creator}
                           </p>
                           <div className="space-y-1 text-sm text-muted-foreground">
                             {startTime ? (
                               <div className="flex items-center gap-2">
                                 <Calendar className="h-4 w-4 text-muted-foreground/60" />
                                 <span>
                                   {format(startTime, "PPP")}
                                 </span>
                               </div>
                             ) : (
                               <p className="text-xs text-muted-foreground/60">Date information unavailable</p>
                             )}
                           </div>
                         </div>
                         <div className="text-right">
                           <Badge variant="outline">Completed</Badge>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 )
               })
             )}
           </TabsContent>
        </Tabs>

        {/* Creator CTA */}
        {user?.role === "USER" && (
          <Card className="mt-8 border bg-muted">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2 text-lg">Become a Creator</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your expertise and earn by creating sessions. Contact support to upgrade your role.
              </p>
              <Button
                onClick={() => alert("Please contact support to upgrade to creator role")}
                variant="outline"
              >
                Learn More
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
