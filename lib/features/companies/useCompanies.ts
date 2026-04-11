import { useQuery } from "@tanstack/react-query";

export interface Company {
  id: number;
  companyName: string;
  email: string;
  phone: string;
  address: string | null;
  city: string;
  companyCode: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async (): Promise<Company[]> => {
      const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8080/api";
      const response = await fetch(`${BACKEND_BASE_URL}/main/companies`);
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
