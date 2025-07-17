import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/utils";

export interface CreateBookingPayload {
  trip_id: number;
  pickup_location_id: string;
  dropoff_location_id: string;
  number_of_tickets: number;
  total_amount: number;
  user_id?: string | null;
  user_email?: string | null;
  user_phone: string;
  user_name: string;
  payment_method: string;
  payment_data?: string | null;
}

export interface BookingResponse {
  booking: Booking;
  message: string;
  payment_reference: string;
}

export interface Booking {
  id: string;
  trip_id: number;
  user_id?: string | null;
  user_email?: string | null;
  user_phone: string;
  user_name: string;
  pickup_location_id: string;
  dropoff_location_id: string;
  number_of_tickets: number;
  total_amount: number;
  status: BookingStatus;
  booking_reference: string;
  created_at: string;
  updated_at: string;
  tickets: Ticket[];
  payment: Payment;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "USED" | "EXPIRED";

export interface Ticket {
  id: string;
  booking_id: string;
  ticket_number: string;
  qr_code: string;
  is_used: boolean;
  created_at: string;
  updated_at: string;
  pickup_location_name: string;
  dropoff_location_name: string;
  car_plate: string;
  car_company: string;
  pickup_time: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = "PENDING" | "COMPLETED" | "REFUNDED";

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation<BookingResponse, Error, CreateBookingPayload>({
    mutationFn: async (payload: CreateBookingPayload) => {
      const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api";
      const response = await apiCall(`${BACKEND_BASE_URL}/book/bookings`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {};
        throw new Error(errorData.message || "Booking failed");
      }
      return response.json();
    },
    // Optionally, add onSuccess, onError, etc.
    // onSuccess: () => {
    //   queryClient.invalidateQueries({ queryKey: ['bookings'] });
    // },
  });
}

export function useUserBookings(userId?: string | null) {
  return useQuery<Booking[], Error>({
    queryKey: ["userBookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) throw new Error("No user ID provided");
      const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api";
      const response = await apiCall(`${BACKEND_BASE_URL}/book/bookings/user/${userId}`);
      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {};
        throw new Error(errorData.message || "Failed to fetch bookings");
      }
      const data = await response.json();
      // If the API returns { bookings: [...] }, adjust accordingly
      if (!data || (Array.isArray(data) && data.length === 0) || (data.bookings && data.bookings.length === 0)) {
        return [];
      }
      return Array.isArray(data) ? data : data.bookings;
    },
  });
}

export function usePayBooking() {
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api";
      const response = await apiCall(`${BACKEND_BASE_URL}/book/bookings/${bookingId}/payment`, {
        method: "POST",
      });
      if (!response || !response.ok) {
        const errorData = response ? await response.json().catch(() => ({})) : {};
        throw new Error(errorData.message || "Payment failed");
      }
      const data = await response.json();
      // Return the paid booking (data.booking)
      return data.booking;
    },
  });
} 