import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10)
  const userPasswordHash = await bcrypt.hash('UserPassword123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@traveltrip.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@traveltrip.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@traveltrip.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'user@traveltrip.com',
      passwordHash: userPasswordHash,
      role: 'USER',
    },
  })

  console.log('Seed completed successfully:')
  console.log(`- Admin: ${admin.email} (${admin.role})`)
  console.log(`- User: ${user.email} (${user.role})`)
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
