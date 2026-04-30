/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: "standalone", // Necesario para Docker en producción
};

export default nextConfig;
