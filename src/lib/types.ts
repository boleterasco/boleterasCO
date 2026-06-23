export type EventCategory = 'CONCIERTO' | 'MUNDIAL_2026' | 'FESTIVAL' | 'TEATRO' | 'DEPORTES' | 'OTRO'
export type ListingStatus  = 'ACTIVE' | 'MATCHED' | 'SOLD' | 'CANCELLED'
export type RequestStatus  = 'OPEN' | 'MATCHED' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED'
export type MatchStatus    = 'PENDING' | 'PAID' | 'TRANSFERRED' | 'COMPLETED' | 'DISPUTED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface User {
  id: string
  email: string
  phone?: string | null
  fullName: string
  ratingAvg?: number | null
  ratingCount?: number
}

export interface Rating {
  id: string
  match_id: string
  stars: number
  comment?: string | null
  created_at: string
}

export interface Event {
  id: string
  name: string
  artist: string
  date: Date | string
  venue: string
  city: string
  category: EventCategory
  imageUrl?: string | null
  isActive: boolean
  isFeatured: boolean
  minPrice?: number
}

export interface Listing {
  id: string
  sellerId: string
  seller: User
  eventId: string
  event: Event
  section: string
  quantity: number
  pricePerTicket: number
  notes?: string | null
  status: ListingStatus
  createdAt: Date | string
}

export interface BuyRequest {
  id: string
  buyerId: string
  buyer: User
  eventId: string
  event: Event
  section?: string | null
  quantity: number
  maxPrice: number
  notes?: string | null
  status: RequestStatus
  createdAt: Date | string
}

export interface Match {
  id: string
  listingId: string
  listing: Listing
  requestId: string
  request: BuyRequest
  status: MatchStatus
  notifiedAt?: Date | string | null
  expiresAt: Date | string
  createdAt: Date | string
  sellerDeadline?: string | null
  paymentAmount?: number | null
}
