import { Client, Environment } from "square";

const environment =
  process.env.SQUARE_ENVIRONMENT === "production"
    ? Environment.Production
    : Environment.Sandbox;

export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment,
});

export const paymentsApi = squareClient.paymentsApi;
export const ordersApi = squareClient.ordersApi;
export const locationsApi = squareClient.locationsApi;

export const LOCATION_ID = process.env.SQUARE_LOCATION_ID!;
