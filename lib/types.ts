export type User = {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export type Product = {
  id: string
  name: string
  image?: string
}

export type Review = {
  [x: string]: any
  id: string
  user: User
  product: Product
  rating: 1 | 2 | 3 | 4 | 5
  text: string
  createdAt: string // ISO date
  updatedAt?: string // ISO date
}
