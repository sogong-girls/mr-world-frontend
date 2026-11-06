import client from "./client";
import { mockTours } from "../mocks/data";

const IS_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const sleep = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const getToursApi = async () => {
  if (IS_MOCK) {
    await sleep();
    return mockTours;
  }
  const response = await client.get("/api/tours");
  return response.data;
};

export const getTourByIdApi = async (id) => {
  if (IS_MOCK) {
    await sleep();
    const tour = mockTours.find((t) => t.id === Number(id));
    if (!tour) throw new Error("Tour not found");
    return tour;
  }
  const response = await client.get(`/api/tours/${id}`);
  return response.data;
};