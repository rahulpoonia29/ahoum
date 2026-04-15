import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { useSessions, useBookings } from "~/lib/hooks"
import { useAuth } from "~/lib/auth"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Spinner } from "~/components/ui/spinner"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { AlertCircle, Calendar, Users, DollarSign, ArrowLeft, CheckCircle, CreditCard } from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog"
import { isSessionPopulated, formatPrice, type Session } from "~/lib/types"

type BookingStep = "initial" | "payment" | "confirmation"

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { fetchSession } = useSessions()
  const { createBooking, createPaymentIntent, confirmBooking, isLoading: bookingLoading } = useBookings()

  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [hasBooked, setHasBooked] = useState(false)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [bookingStep, setBookingStep] = useState<BookingStep>("initial")
  const [pendingBooking, setPendingBooking] = useState<any>(null)

  useEffect(() => {
    const loadSession = async () => {
      if (!id) {
        setError("Invalid session ID")
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const sessionId = parseInt(id, 10)
        if (isNaN(sessionId)) {
          setError("Invalid session ID")
          return
        }

        const data = await fetchSession(sessionId)
        if (!data) {
          setError("Session not found")
          setSession(null)
        } else {
          setSession(data)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load session"
        setError(message)
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [id, fetchSession])

  const handleBookSession = async () => {
    if (!isAuthenticated) {
      navigate("/login")
      return
    }

    if (!session) {
      setError("Session data is missing")
      return
    }

    // Validate session is populated
    if (!isSessionPopulated(session)) {
      setError("Unable to book: session information incomplete")
      return
    }

    try {
      const booking = await createBooking(session.id)
      if (!booking) {
        setError("Failed to create booking")
        return
      }
      setPendingBooking(booking)
      setBookingStep("payment")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create booking"
      setError(message)
    }
  }

  const handleCreatePayment = async () => {
    if (!pendingBooking || !pendingBooking.id) {
      setError("Invalid booking ID")
      return
    }

    try {
      const result = await createPaymentIntent(pendingBooking.id)
      if (!result) {
        setError("Failed to create payment intent")
        return
      }
      setPendingBooking(result)
      setBookingStep("confirmation")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process payment"
      setError(message)
    }
  }

  const handleConfirmPayment = async () => {
    if (!pendingBooking || !pendingBooking.id) {
      setError("Invalid booking ID")
      return
    }

    try {
      const result = await confirmBooking(pendingBooking.id)
      if (!result) {
        setError("Failed to confirm booking")
        return
      }
      setBookingSuccess(true)
      setHasBooked(true)
      setShowBookingDialog(false)
      setTimeout(() => {
        setBookingSuccess(false)
        navigate("/dashboard")
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to confirm booking"
      setError(message)
    }
  }

  const handleCloseDialog = () => {
    setShowBookingDialog(false)
    setBookingStep("initial")
    setPendingBooking(null)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Spinner />
      </main>
    )
  }

  if (!session || !isSessionPopulated(session)) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Button variant="outline" className="mb-6" onClick={() => navigate("/sessions")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Session not found"}</AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  // Safe getters with null checks
  const getCreatorName = (): string => {
    if (!session || !isSessionPopulated(session)) return "Unknown"
    return session.creator?.first_name || session.creator?.username || "Unknown"
  }

  const getCreatorEmail = (): string => {
    if (!session || !isSessionPopulated(session)) return ""
    return session.creator?.email || ""
  }

  const getCreatorAvatar = (): string | undefined => {
    if (!session || !isSessionPopulated(session)) return undefined
    return session.creator?.avatar || undefined
  }

  const getSessionPrice = (): string => {
    if (!session || !isSessionPopulated(session)) return "N/A"
    return formatPrice(session.price)
  }

  const getSessionStartTime = (): Date | null => {
    if (!session || !isSessionPopulated(session)) return null
    try {
      return new Date(session.start_time)
    } catch {
      return null
    }
  }

  const getSessionEndTime = (): Date | null => {
    if (!session || !isSessionPopulated(session)) return null
    try {
      return new Date(session.end_time)
    } catch {
      return null
    }
  }

  const startTime = getSessionStartTime()
  const endTime = getSessionEndTime()

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate("/sessions")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sessions
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {bookingSuccess && (
          <Alert className="mb-6 border bg-muted">
            <CheckCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-muted-foreground">
              Session booked successfully! Redirecting to your dashboard...
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {session.cover_image && (
              <div className="mb-6 h-96 overflow-hidden rounded-lg bg-slate-200">
                <img
                  src={session.cover_image}
                  alt={session.title || "Session"}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl">{session.title || "Untitled Session"}</CardTitle>
                    <CardDescription className="mt-2">
                      by {getCreatorName()}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {getSessionPrice()}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About this session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
               <div className="prose prose-sm max-w-none">
                   <p className="text-foreground whitespace-pre-wrap">
                     {session.description || "No description provided"}
                   </p>
                 </div>

                 <div className="grid gap-4 sm:grid-cols-2">
                   <div className="rounded-lg border bg-card p-4">
                     <div className="flex items-center gap-2 text-muted-foreground mb-1">
                       <Calendar className="h-4 w-4" />
                       <span className="text-sm font-medium">Starts</span>
                     </div>
                     <p className="text-sm text-foreground">
                       {startTime ? format(startTime, "PPp") : "Date unavailable"}
                     </p>
                   </div>

                   <div className="rounded-lg border bg-card p-4">
                     <div className="flex items-center gap-2 text-muted-foreground mb-1">
                       <Calendar className="h-4 w-4" />
                       <span className="text-sm font-medium">Ends</span>
                     </div>
                     <p className="text-sm text-foreground">
                       {endTime ? format(endTime, "PPp") : "Date unavailable"}
                     </p>
                   </div>

                   <div className="rounded-lg border bg-card p-4">
                     <div className="flex items-center gap-2 text-muted-foreground mb-1">
                       <Users className="h-4 w-4" />
                       <span className="text-sm font-medium">Capacity</span>
                     </div>
                     <p className="text-sm text-foreground">
                       Max {session.max_participants || 0} participants
                     </p>
                   </div>

                   <div className="rounded-lg border bg-card p-4">
                     <div className="flex items-center gap-2 text-muted-foreground mb-1">
                       <DollarSign className="h-4 w-4" />
                       <span className="text-sm font-medium">Price</span>
                     </div>
                     <p className="text-sm text-foreground">
                       {getSessionPrice()}
                     </p>
                   </div>
                 </div>
              </CardContent>
            </Card>

            {/* Creator Info */}
            <Card>
              <CardHeader>
                <CardTitle>About the creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {getCreatorAvatar() && (
                    <img
                      src={getCreatorAvatar()}
                      alt={getCreatorName()}
                      className="h-12 w-12 rounded-full"
                    />
                  )}
                   <div>
                     <p className="font-medium text-foreground">
                       {getCreatorName()}
                     </p>
                     <p className="text-sm text-muted-foreground">{getCreatorEmail() || "No email"}</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-2xl">{getSessionPrice()}</CardTitle>
                <CardDescription>
                  {session.max_participants || 0} spots available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasBooked ? (
                  <Button disabled className="w-full" size="lg">
                    Already Booked
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (isAuthenticated) {
                        setShowBookingDialog(true)
                      } else {
                        navigate("/login")
                      }
                    }}
                    className="w-full"
                    size="lg"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? "Booking..." : "Book Now"}
                  </Button>
                )}

                 <div className="space-y-2 pt-4 border-t">
                   <p className="text-sm font-medium text-foreground">What's included:</p>
                   <ul className="text-sm text-muted-foreground space-y-1">
                     <li>✓ Live session access</li>
                     <li>✓ Session materials</li>
                     <li>✓ Expert guidance</li>
                   </ul>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog with Steps */}
      <Dialog open={showBookingDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bookingStep === "initial" && "Confirm Booking"}
              {bookingStep === "payment" && "Payment Information"}
              {bookingStep === "confirmation" && "Confirm Purchase"}
            </DialogTitle>
            <DialogDescription>
              {bookingStep === "initial" && `You're about to book "${session?.title || "this session"}" for ${getSessionPrice()}`}
              {bookingStep === "payment" && "Your payment method will be processed securely"}
              {bookingStep === "confirmation" && "Review and confirm your payment"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
             {/* Step 1: Booking Confirmation */}
             {bookingStep === "initial" && startTime && (
               <>
                 <div className="rounded-lg bg-muted p-4">
                   <p className="text-sm text-muted-foreground">Session starts on</p>
                   <p className="font-medium text-foreground">
                     {format(startTime, "PPpp")}
                   </p>
                 </div>
                 <div className="rounded-lg bg-muted p-4">
                   <p className="text-sm text-muted-foreground">Total amount</p>
                   <p className="text-2xl font-bold text-foreground">
                     {getSessionPrice()}
                   </p>
                 </div>
                 <DialogFooter className="flex gap-3">
                   <Button
                     variant="outline"
                     className="flex-1"
                     onClick={handleCloseDialog}
                   >
                     Cancel
                   </Button>
                   <Button
                     className="flex-1"
                     onClick={handleBookSession}
                     disabled={bookingLoading}
                   >
                     {bookingLoading ? "Processing..." : "Continue to Payment"}
                   </Button>
                 </DialogFooter>
               </>
             )}

             {/* Step 2: Payment */}
             {bookingStep === "payment" && (
               <>
                 <div className="space-y-4">
                   <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center">
                     <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                     <p className="text-sm font-medium text-foreground mb-1">
                       Mock Payment Processing
                     </p>
                     <p className="text-xs text-muted-foreground">
                       This is a demo. Your payment will be processed securely.
                     </p>
                   </div>
                   <div className="rounded-lg bg-muted border p-4">
                     <p className="text-sm text-muted-foreground font-medium">Payment Amount</p>
                     <p className="text-2xl font-bold text-foreground mt-2">
                       {getSessionPrice()}
                     </p>
                   </div>
                 </div>
                 <DialogFooter className="flex gap-3">
                   <Button
                     variant="outline"
                     className="flex-1"
                     onClick={() => setBookingStep("initial")}
                   >
                     Back
                   </Button>
                   <Button
                     className="flex-1"
                     onClick={handleCreatePayment}
                     disabled={bookingLoading}
                   >
                     {bookingLoading ? "Processing..." : "Process Payment"}
                   </Button>
                 </DialogFooter>
               </>
             )}

             {/* Step 3: Confirmation */}
             {bookingStep === "confirmation" && (
               <>
                 <div className="rounded-lg bg-muted border p-4">
                   <div className="flex items-center gap-2 mb-2">
                     <CheckCircle className="h-5 w-5 text-primary" />
                     <p className="font-medium text-foreground">Payment Successful</p>
                   </div>
                   <p className="text-sm text-muted-foreground">
                     Your payment has been processed. Click below to confirm your booking.
                   </p>
                 </div>
                 <div className="rounded-lg bg-muted p-4">
                   <p className="text-sm text-muted-foreground">Transaction Amount</p>
                   <p className="text-2xl font-bold text-foreground mt-1">
                     {getSessionPrice()}
                   </p>
                 </div>
                 <DialogFooter className="flex gap-3">
                   <Button
                     variant="outline"
                     className="flex-1"
                     onClick={handleCloseDialog}
                   >
                     Cancel
                   </Button>
                   <Button
                     className="flex-1"
                     onClick={handleConfirmPayment}
                     disabled={bookingLoading}
                   >
                     {bookingLoading ? "Confirming..." : "Confirm Booking"}
                   </Button>
                 </DialogFooter>
               </>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
