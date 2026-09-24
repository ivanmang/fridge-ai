import { createFileRoute } from "@tanstack/react-router";
import { FridgeApp } from "@/components/fridge/fridge-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <FridgeApp />;
}
