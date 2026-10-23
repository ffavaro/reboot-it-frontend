/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exportación estática: `next build` genera HTML, JS y CSS en /out para servirlos con nginx (sin servidor de Node)
  output: "export",
}

export default nextConfig
