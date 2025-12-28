// medusa-config.ts
import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [ 
          { 
            resolve: "@medusajs/medusa/auth-emailpass", 
            id: "emailpass" 
          } 
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/inventory",
    },
    {
      resolve: "@medusajs/payment",
      // Pas d'options = provider système par défaut (manual)
    },
  ],
})