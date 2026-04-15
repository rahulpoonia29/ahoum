import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "~/lib/auth"
import { useSessions, useBookings } from "~/lib/hooks"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Spinner } from "~/components/ui/spinner"
import { Alert, AlertDescription } from "~/components/ui/alert"
import {
  AlertCircle,
  Plus,
  Calendar,
  Users,
  DollarSign,
  Edit,
  Trash2,
  ArrowRight,
  TrendingUp,
  BookMarked,
} from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import {
  isSessionPopulated,
  isBookingPopulated,
  getSessionId,
  formatPrice,
  type Session,
  type Booking,
} from "~/lib/types"

export default function CreatorDashboard() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { sessions, isLoading: sessionsLoading, fetchSessions, deleteSession } = useSessions()
  const { bookings, isLoading: bookingsLoading, fetchMyBookings } = useBookings()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteSessionId, setDeleteSessionId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/login")
    }
  }, [isAuthenticated, authLoading, navigate])

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role !== "CREATOR") {
        navigate("/dashboard")
        return
      }
      fetchSessions({ creator_id: user.id })
      fetchMyBookings()
    }
  }, [isAuthenticated, user])

  if (authLoading || sessionsLoading || bookingsLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </main>
    )
  }

  if (!isAuthenticated || !user || user.role !== "CREATOR") {
    return null
  }

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return

    try {
      await deleteSession(deleteSessionId)
      setShowDeleteDialog(false)
      setDeleteSessionId(null)
      if (user?.id) {
        fetchSessions({ creator_id: user.id })
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  // Safely filter session bookings
  const sessionBookings = bookings.filter((b) => {
    if (!b) return false
    const bSessionId = getSessionId(b.session)
    return sessions.some((s) => s?.id === bSessionId)
  })

  const confirmedBookings = sessionBookings.filter((b) => b?.status === "CONFIRMED").length
  const pendingBookings = sessionBookings.filter((b) => b?.status === "PENDING").length

  // Safe revenue calculation
  const totalRevenue = sessionBookings
    .filter((b) => b && b.status === "CONFIRMED")
    .reduce((sum, b) => {
      if (!b || !isSessionPopulated(b.session)) return sum
      try {
        const price = parseFloat(b.session.price)
        return sum + (isNaN(price) ? 0 : price)
      } catch {
        return sum
      }
    }, 0)

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Creator Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage your sessions, bookings, and earnings</p>
          </div>
          <Button onClick={() => navigate("/creator/new")} size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Session
          </Button>
        </div>

        {/* Stats Grid */}
         <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground mb-1 font-medium">Total Sessions</p>
                   <p className="text-3xl font-bold text-foreground">{sessions?.length || 0}</p>
                 </div>
                 <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                   <BookMarked className="h-6 w-6 text-primary" />
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground mb-1 font-medium">Total Bookings</p>
                   <p className="text-3xl font-bold text-foreground">{sessionBookings?.length || 0}</p>
                 </div>
                 <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                   <Users className="h-6 w-6 text-muted-foreground" />
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground mb-1 font-medium">Confirmed</p>
                   <p className="text-3xl font-bold text-foreground">{confirmedBookings || 0}</p>
                 </div>
                 <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                   <Users className="h-6 w-6 text-muted-foreground" />
                 </div>
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground mb-1 font-medium">Potential Revenue</p>
                   <p className="text-3xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
                 </div>
                 <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                   <TrendingUp className="h-6 w-6 text-muted-foreground" />
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sessions">
              Sessions ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings ({sessionBookings.length})
            </TabsTrigger>
          </TabsList>

           {/* Sessions Tab */}
           <TabsContent value="sessions" className="space-y-4">
             {!sessions || sessions.length === 0 ? (
               <Card className="border-dashed">
                 <CardContent className="pt-6 text-center">
                   <BookMarked className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                   <p className="text-muted-foreground mb-4 font-medium">You haven't created any sessions yet</p>
                   <Button onClick={() => navigate("/creator/new")}>
                     Create Your First Session
                   </Button>
                 </CardContent>
               </Card>
             ) : (
              sessions.map((session) => {
                if (!session || !isSessionPopulated(session)) {
                  return null
                }

                const sessionBookingCount = sessionBookings.filter(
                  (b) => b && getSessionId(b.session) === session.id
                ).length

                const startTime = (() => {
                  try {
                    return new Date(session.start_time)
                  } catch {
                    return null
                  }
                })()

                return (
                  <Card key={session.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                       <div className="grid gap-4 sm:grid-cols-4">
                         {/* Info */}
                         <div className="sm:col-span-2">
                           <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                             {session.title}
                           </h3>
                           <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                             {session.description || "No description"}
                           </p>
                           <div className="space-y-2 text-sm text-muted-foreground">
                             <div className="flex items-center gap-2">
                               <Calendar className="h-4 w-4 text-muted-foreground/60" />
                               <span>
                                 {startTime ? format(startTime, "MMM dd, HH:mm") : "Date unavailable"}
                               </span>
                             </div>
                             <div className="flex items-center gap-2">
                               <Users className="h-4 w-4 text-muted-foreground/60" />
                               <span>Max {session.max_participants || 0} participants</span>
                             </div>
                           </div>
                         </div>

                         {/* Stats */}
                         <div>
                           <div className="mb-3">
                             <p className="text-xs text-muted-foreground/70 mb-1">Price</p>
                             <Badge variant="secondary" className="text-base px-3 py-1">
                               {formatPrice(session.price)}
                             </Badge>
                           </div>
                           <div>
                             <p className="text-xs text-muted-foreground/70 mb-1">Bookings</p>
                             <p className="text-lg font-semibold text-foreground">
                               {sessionBookingCount}
                             </p>
                           </div>
                         </div>

                         {/* Actions */}
                         <div className="flex flex-col gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => navigate(`/sessions/${session.id}`)}
                             className="justify-between"
                           >
                             View <ArrowRight className="h-3 w-3" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => navigate(`/creator/${session.id}/edit`)}
                           >
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => {
                               setDeleteSessionId(session.id)
                               setShowDeleteDialog(true)
                             }}
                           >
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </div>
                       </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

           {/* Bookings Tab */}
           <TabsContent value="bookings" className="space-y-4">
             {!sessionBookings || sessionBookings.length === 0 ? (
               <Card className="border-dashed">
                 <CardContent className="pt-6 text-center">
                   <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                   <p className="text-muted-foreground">No bookings yet</p>
                 </CardContent>
               </Card>
             ) : (
               sessionBookings.map((booking) => {
                 if (!booking) return null

                 const session = sessions.find((s) => s && s.id === getSessionId(booking.session))
                 const user_ =
                   booking.user && typeof booking.user === "object" ? booking.user : null

                 const createdDate = (() => {
                   try {
                     return new Date(booking.created_at)
                   } catch {
                     return null
                   }
                 })()

                 return (
                   <Card key={booking.id} className="overflow-hidden hover:shadow-md transition-shadow">
                     <CardContent className="pt-6">
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                             <h3 className="font-semibold text-foreground">
                               {session?.title || "Session"}
                             </h3>
                             {booking.status === "CONFIRMED" ? (
                               <Badge variant="default">
                                 Confirmed
                               </Badge>
                             ) : (
                               <Badge variant="secondary">
                                 Pending
                               </Badge>
                             )}
                           </div>
                           <div className="flex items-center gap-4 mt-3">
                             {user_ && (
                               <div className="flex items-center gap-2">
                                 <Avatar className="h-8 w-8">
                                   <AvatarImage src={user_.avatar || undefined} alt={user_.username} />
                                   <AvatarFallback className="text-xs bg-muted">
                                     {user_.username?.charAt(0).toUpperCase() || "U"}
                                   </AvatarFallback>
                                 </Avatar>
                                 <span className="text-sm text-muted-foreground">
                                   {user_.first_name || user_.username || "User"}
                                 </span>
                               </div>
                             )}
                             <div className="text-sm text-muted-foreground">
                               {createdDate ? format(createdDate, "MMM dd, yyyy") : "Date unavailable"}
                             </div>
                           </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-muted-foreground/70 mb-1">Amount</p>
                           <p className="text-2xl font-bold text-foreground">
                             {isSessionPopulated(booking.session)
                               ? formatPrice(booking.session.price)
                               : "N/A"}
                           </p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 )
               })
             )}
           </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteSession}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
