import axios from 'axios';

// Replace with your actual backend URL
const BASE_URL = 'https://campus-backend-production-513a.up.railway.app/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  // Import your auth storage here, e.g. SecureStore
  // const token = await SecureStore.getItemAsync('token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  category: string;
  images: string[];        // Cloudinary URLs
  college: string;
  interestCount: number;
  createdAt: string;       // ISO string
  sellerId: string;        // DO NOT expose seller name until chat accepted
}

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  images: string[];
}

/** Fetch paginated marketplace feed */
export const fetchListings = async (page = 1, category?: string): Promise<Listing[]> => {
  const params: Record<string, unknown> = { page, limit: 20 };
  if (category && category !== 'All') params.category = category;
  const response = await api.get('/listings/feed', { params });
  return response.data.listings;
};

/** Fetch a single listing by ID */
export const fetchListingById = async (id: string): Promise<Listing> => {
  const response = await api.get(`/listings/${id}`);
  return response.data;
};

/** Create a new listing */
export const createListing = async (payload: CreateListingPayload): Promise<Listing> => {
  const response = await api.post('/listings', payload);
  return response.data;
};

/** Express interest — creates a chat request */
export const requestChat = async (listingId: string): Promise<{ chatId: string }> => {
  const response = await api.post('/chats/request', { listingId });
  return response.data;
};

export default api;
