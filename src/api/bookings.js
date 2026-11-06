import client from "./client";
import { mockBookings } from "../mocks/data";

const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const sleep = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const getMyBookingsApi = async () => {
  if (IS_MOCK) {
    await sleep();
    return mockBookings;
  }
  const response = await client.get("/api/bookings");
  return response.data;
};