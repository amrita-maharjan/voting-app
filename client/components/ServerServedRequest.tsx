// app/components/ServerServedRequests.tsx
import { redis } from "@/client/lib/redis";

export default async function ServerServedRequests() {
  const count = (await redis.get<number>("served-requests")) ?? 0;
  return <span>{Math.ceil(count / 10) * 10}</span>;
}
