import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LAN dev is opened in a browser on the M4 as http://10.0.0.161:3103.
  // That host is a different origin from localhost, so Next blocks the
  // dev assets unless it is listed.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "10.0.0.161",
    "prankster.int.cyberworldbuilders.dev",
  ],
};

export default nextConfig;
