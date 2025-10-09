export type Provider = "google" | "credentials"
export type Role = "user" | "admin"

export interface User {
  id: string
  name: string
  email: string
  provider: Provider
  role: Role
  createdAt: string
  lastActive: string
  avatarUrl?: string
}

const NAMES = [
  "Ava Chen",
  "Liam Patel",
  "Sophia Nguyen",
  "Noah Kim",
  "Mia Rodriguez",
  "Ethan Johnson",
  "Isabella Martinez",
  "Lucas Brown",
  "Amelia Davis",
  "Oliver Wilson",
  "Charlotte Garcia",
  "Elijah Anderson",
  "Harper Thomas",
  "William Moore",
  "Evelyn Taylor",
  "James Lee",
  "Abigail White",
  "Benjamin Harris",
  "Emily Clark",
  "Michael Lewis",
  "Elizabeth Walker",
  "Daniel Hall",
  "Sofia Young",
  "Henry Allen",
  "Aria King",
  "Jackson Wright",
  "Scarlett Scott",
  "Sebastian Green",
  "Victoria Adams",
  "Mateo Baker",
  "Luna Nelson",
  "Jack Carter",
  "Grace Mitchell",
  "Owen Perez",
  "Hazel Roberts",
  "Wyatt Turner",
  "Nora Phillips",
  "Luke Campbell",
  "Chloe Parker",
  "Jayden Evans",
  "Zoey Edwards",
  "Levi Collins",
  "Riley Stewart",
  "Isaac Sanchez",
  "Ellie Morris",
  "Gabriel Rogers",
  "Layla Reed",
]

function randomFrom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function randomDateWithin(days: number) {
  const now = Date.now()
  const past = now - Math.floor(Math.random() * days) * 24 * 60 * 60 * 1000
  return new Date(past)
}

let users: User[] = NAMES.map((name, i) => {
  const provider: Provider = Math.random() < 0.6 ? "google" : "credentials"
  const role: Role = Math.random() < 0.15 ? "admin" : "user"
  const created = randomDateWithin(365)
  const lastActive = randomDateWithin(30)
  const slug = name.toLowerCase().replace(/[^a-z]+/g, ".")
  return {
    id: String(1000 + i),
    name,
    email: `${slug}@example.com`,
    provider,
    role,
    createdAt: created.toISOString(),
    lastActive: lastActive.toISOString(),
    avatarUrl: `/placeholder.svg?height=64&width=64&query=${encodeURIComponent("user avatar " + name)}`,
  }
})

export function listUsers(params: {
  search?: string
  role?: Role
  provider?: Provider
  page?: number
  pageSize?: number
  sort?: "createdAt"
  order?: "asc" | "desc"
}) {
  const { search = "", role, provider, page = 1, pageSize = 10, sort = "createdAt", order = "desc" } = params

  let filtered = users.slice()

  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
  }
  if (role) filtered = filtered.filter((u) => u.role === role)
  if (provider) filtered = filtered.filter((u) => u.provider === provider)

  filtered.sort((a, b) => {
    const va = new Date(a[sort]).getTime()
    const vb = new Date(b[sort]).getTime()
    return order === "asc" ? va - vb : vb - va
  })

  const total = filtered.length
  const start = (page - 1) * pageSize
  const pageItems = filtered.slice(start, start + pageSize)

  return { users: pageItems, total, page, pageSize }
}

export function getUser(id: string) {
  return users.find((u) => u.id === id)
}

export function updateUserRole(id: string, role: Role) {
  const u = users.find((u) => u.id === id)
  if (u) u.role = role
  return u
}

export function deleteUser(id: string) {
  const before = users.length
  users = users.filter((u) => u.id !== id)
  return users.length < before
}

export function getMetrics() {
  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.role === "admin").length
  const googleSignups = users.filter((u) => u.provider === "google").length
  return { totalUsers, totalAdmins, googleSignups }
}
