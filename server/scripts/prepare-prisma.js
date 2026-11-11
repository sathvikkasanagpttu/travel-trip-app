import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma')

export const preparePrismaSchema = () => {
  if (!fs.existsSync(schemaPath)) {
    console.error(`schema.prisma not found at ${schemaPath}`)
    return
  }

  const databaseUrl = process.env.DATABASE_URL || ''
  const isPostgres = databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')

  let schema = fs.readFileSync(schemaPath, 'utf8')

  if (isPostgres) {
    console.log('🔄 Detected PostgreSQL DATABASE_URL. Setting datasource provider to "postgresql"...')
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"')

    if (process.env.DIRECT_URL && !schema.includes('directUrl')) {
      schema = schema.replace(
        /url\s*=\s*env\("DATABASE_URL"\)/,
        'url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
      )
    }
  } else {
    console.log('🔄 Detected SQLite/local DATABASE_URL. Setting datasource provider to "sqlite"...')
    schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"')
    schema = schema.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '')
  }

  fs.writeFileSync(schemaPath, schema, 'utf8')
  console.log('✔ Prisma schema prepared successfully.')
}

if (process.argv[1] === __filename) {
  preparePrismaSchema()
}
